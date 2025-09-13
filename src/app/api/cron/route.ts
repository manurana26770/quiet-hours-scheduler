import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '@/lib/emailGmail'

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Timezone': 'Asia/Kolkata'
    }
  }
})

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (production security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const userAgent = request.headers.get('user-agent')
    
    // Allow requests from cron-job.org and other known cron services
    const isKnownCronService = userAgent?.includes('cron-job.org') || 
                              userAgent?.includes('cron-job')
    
    // For development/testing, allow requests without secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow known cron services or development mode
      if (process.env.NODE_ENV === 'production' && !isKnownCronService) {
        console.log('Cron request rejected - unauthorized')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      } else {
        console.log('Development mode or known cron service: Allowing request')
      }
    }

    // Get current time
    const now = new Date()
    const nowISO = now.toISOString()

    // Find quiet blocks that need reminders
    // We're looking for blocks where:
    // 1. The block is active
    // 2. Reminder hasn't been sent yet
    // 3. Start time is in the future (block hasn't started yet)
    
    const { data: quietBlocks, error: fetchError } = await supabase
      .from('quiet_blocks')
      .select('*')
      .eq('is_active', true)
      .eq('reminder_sent', false)
      .gt('start_time', nowISO)

    if (fetchError) {
      console.error('Error fetching quiet blocks:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch quiet blocks' }, { status: 500 })
    }

    // First, deactivate any expired blocks
    const expiredBlocks = (quietBlocks || []).filter(block => {
      const endTime = new Date(block.end_time)
      return block.is_active && endTime < now
    })

    if (expiredBlocks.length > 0) {
      const expiredBlockIds = expiredBlocks.map(block => block.id)
      const { error: updateError } = await supabase
        .from('quiet_blocks')
        .update({ is_active: false })
        .in('id', expiredBlockIds)

      if (updateError) {
        console.error('Error deactivating expired blocks:', updateError)
      }
    }

    // Filter out expired blocks from reminder processing
    const activeBlocks = (quietBlocks || []).filter(block => {
      const endTime = new Date(block.end_time)
      return endTime >= now
    })

    if (activeBlocks.length === 0) {
      return NextResponse.json({ 
        message: 'No active quiet blocks need reminders at this time',
        timestamp: nowISO,
        checked: quietBlocks?.length || 0,
        expired: expiredBlocks.length,
        sent: 0
      })
    }

    let sentCount = 0
    let errorCount = 0

    // Process each active quiet block
    for (const block of activeBlocks) {
      try {
        const startTime = new Date(block.start_time)
        const reminderTime = new Date(startTime.getTime() - 10 * 60 * 1000) // 10 minutes before
        
        console.log(`Processing block ${block.id}:`, {
          title: block.title,
          startTime: startTime.toISOString(),
          reminderTime: reminderTime.toISOString(),
          currentTime: now.toISOString(),
          timeDiff: Math.abs(now.getTime() - reminderTime.getTime()),
          isBeforeStart: now < startTime
        })
        
        // Check if it's time to send the reminder
        // We send the reminder if current time is within 5 minutes of the reminder time
        const timeDiff = Math.abs(now.getTime() - reminderTime.getTime())
        const fiveMinutesInMs = 5 * 60 * 1000
        
        if (timeDiff <= fiveMinutesInMs && now < startTime) {
          console.log(`✅ Block ${block.id} is ready for reminder`)
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', block.user_id)
            .single()

          if (profileError || !profile) {
            console.warn(`No profile found for user ${block.user_id}:`, profileError)
            continue
          }

          const userEmail = profile.email
          const userName = profile.full_name || userEmail?.split('@')[0] || 'User'
          
          if (!userEmail) {
            console.warn(`No email found for user ${block.user_id}`)
            continue
          }

          // Send the email
          try {
            await sendReminderEmail({
              to: userEmail,
              userName,
              blockName: block.title,
              startTime,
              endTime: new Date(block.end_time),
              description: '', // No description field in simplified schema
              location: '', // No location field in simplified schema
              category: 'general', // No category field in simplified schema
              reminderMinutes: 10,
            })

            // Mark reminder as sent
            const { error: updateError } = await supabase
              .from('quiet_blocks')
              .update({ reminder_sent: true })
              .eq('id', block.id)

            if (updateError) {
              console.error(`Error updating reminder status for block ${block.id}:`, updateError)
              errorCount++
            } else {
              sentCount++
              console.log(`✅ Reminder sent to ${userEmail} for block: ${block.title}`)
            }
          } catch (emailError) {
            console.error(`❌ Failed to send email for block ${block.id}:`, emailError)
            console.error(`Email error details:`, {
              blockId: block.id,
              userEmail,
              userName,
              blockTitle: block.title,
              error: emailError
            })
            errorCount++
          }
        } else {
          console.log(`⏰ Block ${block.id} not ready for reminder yet:`, {
            timeDiff: timeDiff,
            fiveMinutesInMs: fiveMinutesInMs,
            isWithinTimeWindow: timeDiff <= fiveMinutesInMs,
            isBeforeStart: now < startTime,
            reason: timeDiff > fiveMinutesInMs ? 'Too early/late' : 'Block already started'
          })
        }
      } catch (error) {
        console.error(`Error processing block ${block.id}:`, error)
        errorCount++
      }
    }

    const result = {
      message: 'Cron job completed',
      timestamp: nowISO,
      processed: quietBlocks.length,
      sent: sentCount,
      errors: errorCount
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Optional: POST endpoint for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}