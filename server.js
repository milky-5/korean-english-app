require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
// 나중을 위해서(Node 18 이상이면 불필요하다고 함.250418)
// const fetch = require("node-fetch"); // ✨ 무료 사전 API 호출용. 

const app = express();
//이전에는 const port = 8080; 이었음. 고정 포트 8080 대신 환경 변수 지원하는 방식이 좋다고 수정.250418)
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ 무료 영어 사전 API (단어 뜻과 발음 조회)
app.get("/dictionary", async (req, res) => {
  const word = req.query.word;
  if (!word) return res.status(400).json({ error: "단어가 없습니다." });

  try {
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return res.status(404).json({ meaning: null, pronunciation: null });
    }

    const data = await response.json();
    const meaning = data[0]?.meanings?.[0]?.definitions?.[0]?.definition || null;
    const pronunciation = data[0]?.phonetics?.[0]?.text || null;

    res.json({ meaning, pronunciation });
  } catch (error) {
    console.error("❌ 뜻 조회 오류:", error.message);
    res.status(500).json({ error: "뜻 조회 실패" });
  }
});

// 메인 번역 엔드포인트
app.post("/translate", async (req, res) => {
  const korean = req.body.korean;
  if (!korean) return res.status(400).json({ error: "한국어 문장이 없습니다." });

  try {
   //나중을 위해서(개발 중에 디버깅에는 좋지만 배포 후에는 if (process.env.NODE_ENV !== "production") 조건 안에서 출력하거나 제거가 좋음.250418)
    //console.log("🔵 번역 요청 받음:", korean);

    const translationResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `Translate the following into natural English: ${korean}` }],
    });

    const english = translationResponse.choices[0].message.content.trim();

    const dialogueResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Using this sentence: "${english}", create 2 short natural dialogues in English. 
Each dialogue should have 2 lines: one by A, one by B. Return as an array of arrays like [["A: ...", "B: ..."], ["A: ...", "B: ..."]].`,
        },
      ],
    });

    const dialogues = JSON.parse(dialogueResponse.choices[0].message.content.trim());
   
    //나중을 위해서(개발 중에 디버깅에는 좋지만 배포 후에는 if (process.env.NODE_ENV !== "production") 조건 안에서 출력하거나 제거가 좋음.250418)
   // console.log("🟢 번역 완료:", english);
    res.json({ english, dialogues });
  } catch (error) {
    console.error("🔴 번역 오류:", error.message);
    res.status(500).json({ error: "번역 실패" });
  }
});

// 문장별 번역 엔드포인트
app.post("/translate-line", async (req, res) => {
  const text = req.body.text;
  if (!text) return res.status(400).json({ error: "문장이 없습니다." });

  try {
   //나중을 위해서(개발 중에 디버깅에는 좋지만 배포 후에는 if (process.env.NODE_ENV !== "production") 조건 안에서 출력하거나 제거가 좋음.250418)
    //console.log("📌 문장 번역 요청:", text);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `Translate the following into Korean: ${text}` }],
    });

    const translated = response.choices[0].message.content.trim();
    res.json({ translated });
  } catch (error) {
    console.error("🔴 번역 오류:", error.response?.data || error.message);
    res.status(500).json({ error: "번역 실패" });
  }
});

app.listen(port, () => {
  console.log(`🚀 서버가 http://localhost:${port} 에서 실행 중`);
});