const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/translate", async (req, res) => {
  const korean = req.body.korean;

  try {
    // 번역
    const translationRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `다음 한국어 문장을 자연스럽고 감성적으로 영어로 번역해줘:\n"${korean}"` }],
      }),
    });

    const translationData = await translationRes.json();
    console.log("번역 응답:", translationData);

    const english = translationData.choices?.[0]?.message?.content?.trim();
    if (!english) {
      console.error("번역 실패 응답:", translationData);
      return res.status(500).json({ error: "번역 실패" });
    }

    // 회화 예시 생성
    const dialogueRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `영어 문장 "${english}" 을(를) 포함하는 간단한 일상 회화 예시 2개 만들어줘.` }],
      }),
    });

    const dialogueData = await dialogueRes.json();
    console.log("대화 예시 응답:", dialogueData);

    const dialogues = dialogueData.choices?.[0]?.message?.content?.trim();
    if (!dialogues) {
      console.error("회화 예시 실패 응답:", dialogueData);
      return res.status(500).json({ error: "회화 예시 생성 실패" });
    }

    res.json({ english, dialogues });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "API 요청 실패" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
