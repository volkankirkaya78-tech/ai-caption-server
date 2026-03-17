import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

dotenv.config()

const app = express()

app.use(cors())

/* LemonSqueezy webhook raw body ister */
app.use("/webhook", express.raw({ type: "application/json" }))

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

/* ==============================
SUPABASE
============================== */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/* ==============================
OPENAI
============================== */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/* ==============================
LEMON SQUEEZY WEBHOOK
============================== */

app.post("/webhook", async (req, res) => {

  try {

    console.log("Webhook received:", JSON.stringify(req.body, null, 2))

    const event = req.body?.meta?.event_name

    // ödeme ile ilgili tüm eventleri yakala
    if (
      event === "order_created" ||
      event === "subscription_created" ||
      event === "subscription_payment_success"
    ) {

      const email =
        req.body?.data?.attributes?.user_email ||
        req.body?.data?.attributes?.customer_email ||
        req.body?.data?.attributes?.email ||
        req.body?.data?.attributes?.user?.email ||
        req.body?.data?.attributes?.customer?.email

      if (!email) {
        console.log("Email not found in webhook payload")
        return res.sendStatus(200)
      }

      console.log("💰 Payment received from:", email)

      const { error } = await supabase
        .from("users")
        .upsert({
          email: email,
          plan: "pro"
        })

      if (error) {
        console.log("Supabase error:", error)
      } else {
        console.log("✅ User upgraded to PRO")
      }

    }

    res.sendStatus(200)

  } catch (error) {

    console.log("Webhook error:", error)
    res.sendStatus(500)

  }

})


/* ==============================
CAPTION GENERATOR
============================== */

app.post("/caption", async (req, res) => {

  try {

    const { image, style } = req.body

    const response = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        {
          role: "system",
          content: "You are a social media growth strategist. Return JSON only."
        },

        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and generate viral social media content.

Return JSON format:

{
 "captions":["","","","",""],
 "viral_score":"1-10",
 "optimized_caption":"",
 "why_it_works":"",
 "hooks":["","","","","","","","","",""],
 "hashtags":["","","","","","","","","",""],
 "reel_script":{
   "hook":"",
   "scene":"",
   "voiceover":""
 }
}

Caption style: ${style}`
            },
            {
              type: "image_url",
              image_url: { url: image }
            }
          ]
        }

      ],

      response_format: { type: "json_object" }

    })

    res.json(JSON.parse(response.choices[0].message.content))

  } catch (error) {

    console.log(error)
    res.status(500).json({ error: "caption generation failed" })

  }

})

/* ==============================
TREND DETECTOR
============================== */

app.post("/trend-detector", async (req, res) => {

  try {

    const response = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        {
          role: "system",
          content: "You analyze social media trends."
        },

        {
          role: "user",
          content: `
Return JSON only.

{
 "trends":[
  {
   "title":"",
   "platform":"",
   "why_trending":"",
   "content_idea":"",
   "example_hook":""
  }
 ]
}
`
        }

      ],

      response_format:{type:"json_object"}

    })

    res.json(JSON.parse(response.choices[0].message.content))

  } catch (error) {

    res.status(500).json({error:"trend detection failed"})

  }

})

/* ==============================
VIRAL IDEAS
============================== */

app.post("/viral-topics", async (req, res) => {

  try {

    const response = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        {
          role: "system",
          content: "You generate viral social media ideas."
        },

        {
          role: "user",
          content: `
Return JSON:

{
 "viral_topics":[
  {
   "title":"",
   "hook":"",
   "why_viral":""
  }
 ]
}
`
        }

      ],

      response_format:{type:"json_object"}

    })

    res.json(JSON.parse(response.choices[0].message.content))

  } catch (error) {

    res.status(500).json({error:"viral idea generation failed"})

  }

})

/* ==============================
CONTENT CALENDAR
============================== */

app.post("/content-calendar", async (req, res) => {

  try {

    const { niche } = req.body

    const response = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        {
          role: "system",
          content: "You create social media content plans."
        },

        {
          role: "user",
          content: `
Create a 30 day content calendar.

Niche: ${niche}

Return JSON:

{
 "calendar":[
  {
   "day":1,
   "type":"",
   "title":"",
   "hook":""
  }
 ]
}
`
        }

      ],

      response_format:{type:"json_object"}

    })

    res.json(JSON.parse(response.choices[0].message.content))

  } catch (error) {

    res.status(500).json({error:"calendar generation failed"})

  }

})

/* ==============================
REEL GENERATOR
============================== */

app.post("/reel-generator", async (req, res) => {

  try {

    const { topic, niche, platform } = req.body

    const response = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        {
          role: "system",
          content: "You are an expert short form video creator."
        },

        {
          role: "user",
          content: `
Create a viral ${platform} reel.

Topic: ${topic}
Niche: ${niche}

Return JSON:

{
 "title":"",
 "hook":"",
 "shot_list":"",
 "voiceover":"",
 "editing_guide":"",
 "caption":"",
 "hashtags":""
}
`
        }

      ],

      response_format:{type:"json_object"}

    })

    res.json(JSON.parse(response.choices[0].message.content))

  } catch (error) {

    res.status(500).json({error:"reel generation failed"})

  }

})

/* ==============================
COMPETITOR ANALYZER
============================== */

app.post("/competitor-analyzer", async (req, res) => {

  try {

    const { username, niche, platform } = req.body

    const response = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        {
          role: "system",
          content: "You are a social media strategist."
        },

        {
          role: "user",
          content: `
Analyze this creator account.

Username: ${username}
Niche: ${niche}
Platform: ${platform}

Return JSON:

{
 "content_strategy":"",
 "viral_formats":"",
 "hook_patterns":"",
 "posting_strategy":"",
 "growth_tips":""
}
`
        }

      ],

      response_format:{type:"json_object"}

    })

    res.json(JSON.parse(response.choices[0].message.content))

  } catch (error) {

    res.status(500).json({error:"competitor analysis failed"})

  }

})

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000")
})
