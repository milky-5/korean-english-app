// --- [비밀번호 인증 로직 추가] ---
function showLoginForm() {
  document.body.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div class="bg-white p-8 rounded shadow max-w-xs w-full">
        <h2 class="text-xl font-bold mb-4 text-center">비밀번호 입력</h2>
        <input id="loginPassword" type="password" class="w-full border p-2 rounded mb-4" placeholder="비밀번호" />
        <button id="loginBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">로그인</button>
        <div id="loginError" class="text-red-500 mt-2 text-center"></div>
      </div>
    </div>
  `;
  document.getElementById("loginBtn").onclick = async () => {
    const password = document.getElementById("loginPassword").value;
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // 인증 성공: localStorage에 표시 후 새로고침
        localStorage.setItem("isAuthed", "yes");
        location.reload();
      } else {
        // 인증 실패: 에러 메시지 표시
        const data = await res.json().catch(() => ({}));
        document.getElementById("loginError").textContent = data.error || "로그인 실패";
      }
    } catch (err) {
      // 네트워크/서버 에러 처리
      document.getElementById("loginError").textContent = "서버 오류, 다시 시도해주세요.";
      console.error("🔴 로그인 요청 오류:", err);
    }
  };
}

// 인증 여부 확인: 없으면 로그인 폼만 보여주고, 있으면 기존 앱 실행
if (localStorage.getItem("isAuthed") !== "yes") {
  showLoginForm();
  // 아래 코드 실행 중단 (앱 기능 차단)
} else {
  document.addEventListener("DOMContentLoaded", () => {
    window.speechSynthesis.cancel();
    document.getElementById("generateBtn").addEventListener("click", generateExample);
  });
  // 나중을 위해서: 전체 듣기 버튼에 대한 이벤트도 여기에 추가 가능
  let allUtterances = [];

  function speakText(text, element) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    element.classList.add("text-blue-600");
    element.style.opacity = "0.6"; // 로딩 느낌

    utterance.onstart = () => {
      element.classList.add("animate-pulse"); // 애니메이션 효과
    };

    utterance.onend = () => {
      element.classList.remove("text-blue-600", "animate-pulse");
      element.style.opacity = "1";
    };

     // ✅ 오류 팝업 없이 콘솔에만 에러 출력
     utterance.onerror = (e) => {
      console.error("🔊 음성 재생 오류:", e.error || e);
      element.classList.remove("text-blue-600", "animate-pulse");
      element.style.opacity = "1";
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking(element) {
    window.speechSynthesis.cancel();
    element.classList.remove("text-blue-600");
  }
  // 나중을 위해서: 전체 멈춤 버튼이 있다면 이 함수 재사용 가능

  // ✅ 단어 팝업창 함수
  function showDefinitionPopup(word, definition, phonetic) {
    const content = document.createElement("div");

    const defElem = document.createElement("div");
    defElem.textContent = definition;
    defElem.className = "text-lg font-semibold mb-2";

    const phoneticElem = document.createElement("div");
    phoneticElem.textContent = phonetic || "";
    phoneticElem.className = "text-sm text-gray-600 mb-2";

    const speakerBtn = document.createElement("button");
    speakerBtn.innerHTML = "🔊 발음 듣기";
    speakerBtn.className = "bg-blue-500 text-white px-3 py-1 rounded";
    speakerBtn.onclick = () => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = "en-US";
      window.speechSynthesis.speak(utter);
    };

    content.appendChild(defElem);
    content.appendChild(phoneticElem);
    content.appendChild(speakerBtn);

    Swal.fire({
      title: `"${word}"`,
      html: content,
      showConfirmButton: false,
    });
  }

  function addWordPopupEvents(element) {
    const words = element.innerText.split(" ");
    element.innerHTML = "";

    words.forEach((word, idx) => {
      const span = document.createElement("span");
      span.textContent = word;
      span.className = "cursor-pointer hover:underline hover:text-purple-600";
      span.onclick = () => {
        // 1. 전처리: 특수문자 제거 (예: hello. → hello)
        const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, "");  // 앞뒤 특수문자 제거
      
        fetch(`/dictionary?word=${encodeURIComponent(cleanWord)}`)
        // 나중을 위해서: 외부 사전 API로 대체 가능
          .then((res) => res.json())
          .then((data) => {
            const meaning = data.meaning || "뜻을 찾을 수 없습니다.";
            const pronunciation = data.pronunciation || "";
            showDefinitionPopup(cleanWord, meaning, pronunciation);  // 전처리된 단어로 팝업 표시
          })
          .catch((err) => {
            console.error("❌ 뜻 조회 실패:", err);
            Swal.fire("오류", "뜻을 찾는 데 실패했습니다.", "error");
          });
      };

      element.appendChild(span);
      if (idx < words.length - 1) {
        element.appendChild(document.createTextNode(" "));
      }
    });
  }

  function createTTSButton(text, textElement, showTranslateBtn = true) {
    const container = document.createElement("div");
    container.className = "flex gap-2";

    const playBtn = document.createElement("button");
    //아이콘으로 변경 className은 그대로
    playBtn.innerHTML = `<img src="/assets/icons/speaker.png" alt="play" class="w-6 h-6" />`;
    playBtn.className = "bg-blue-500 text-white px-2 rounded";
    playBtn.onclick = () => speakText(text, textElement);

    const stopBtn = document.createElement("button");
    //아이콘으로 변경 className은 그대로
    stopBtn.innerHTML = `<img src="/assets/icons/stop.png" alt="stop" class="w-6 h-6" />`;
    stopBtn.className = "bg-red-500 text-white px-2 rounded";
    stopBtn.onclick = () => stopSpeaking(textElement);

    const translatedLine = document.createElement("div");
    translatedLine.className = "mt-1 text-gray-700 text-sm italic";
    translatedLine.style.minHeight = "1.5rem";

    container.appendChild(playBtn);
    container.appendChild(stopBtn);

    if (showTranslateBtn) {
      const translateBtn = document.createElement("button");
      //아이콘으로 변경 className은 그대로
      translateBtn.innerHTML = `<img src="/assets/icons/pencil.png" alt="translate" class="w-6 h-6" />`;
      translateBtn.className = "bg-purple-600 text-white px-2 rounded";
      translateBtn.onclick = async () => {
        if (!text || typeof text !== "string") {
          console.error("❌ 번역 요청 실패: text가 유효하지 않음", text);
          translatedLine.textContent = "번역 실패 (문장이 없습니다)";
          return;
        }

        translateBtn.disabled = true;
        translateBtn.textContent = "번역 중...";

        try {
          const res = await fetch("/translate-line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          const data = await res.json();
          translatedLine.textContent = data.translated || "번역 실패";
        } catch (err) {
          translatedLine.textContent = "번역 실패";
          console.error("번역 오류:", err);
        } finally {
          translateBtn.disabled = false;
          translateBtn.innerHTML = `<img src="/assets/icons/pencil.png" alt="translate" class="w-6 h-6" />`;
        }
      };
      container.appendChild(translateBtn);
    }

    return { buttonContainer: container, translatedLine };
  }

  function generateExample() {
    const koreanText = document.getElementById("koreanText").value.trim();
    if (!koreanText) return Swal.fire("문장을 입력해주세요");

    fetch("/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ korean: koreanText }),
    })
      .then((res) => res.json())
      .then((data) => {
        const translation = data.english;
        if (!translation || typeof translation !== "string") {
        Swal.fire("번역 실패", "입력하신 문장에서 번역 결과를 얻지 못했습니다.", "error");
       return;
   }

        const examples = data.dialogues || [];

        console.log("📥 번역된 문장:", translation);
        console.log("🗨️ 회화 예시 데이터:", examples);

        const translatedTextElem = document.getElementById("translatedText");
        translatedTextElem.innerText = `"${translation}"`;
        addWordPopupEvents(translatedTextElem);

        const translatedTTSButtons = document.getElementById("translatedTTSButtons");
        translatedTTSButtons.innerHTML = "";
        translatedTTSButtons.appendChild(
          createTTSButton(translation, translatedTextElem, false).buttonContainer
        );

        const container = document.getElementById("conversationContainer");
        container.innerHTML = "";
        allUtterances = [];

        examples.slice(0, 2).forEach((lines, i) => {
          // 나중을 위해서: 회차 수 제한을 설정에서 조정 가능하도록 변경 가능
          const round = document.createElement("div");
          round.className = "space-y-2";

          const roundLabel = document.createElement("div");
          roundLabel.className = "font-bold";
          roundLabel.textContent = `${i + 1}.`;
          round.appendChild(roundLabel);

          lines.forEach((line) => {
            if (!line || typeof line !== "string") {
              console.warn("⚠️ 잘못된 대사 건너뜀:", line);
              return;
            }

            const lineWrapper = document.createElement("div");
            lineWrapper.className = "flex items-start gap-2";

            const lineText = document.createElement("div");
            lineText.className = "p-2 bg-gray-100 rounded w-full";
            lineText.innerText = line;

            addWordPopupEvents(lineText);

            const { buttonContainer, translatedLine } = createTTSButton(line, lineText);
            lineWrapper.appendChild(lineText);
            lineWrapper.appendChild(buttonContainer);
            round.appendChild(lineWrapper);
            round.appendChild(translatedLine);

            allUtterances.push({ text: line, element: lineText });
          });

          container.appendChild(round);
        });
      })
      .catch((err) => {
        console.error("번역 요청 실패:", err);
        Swal.fire("번역에 실패했습니다. 다시 시도해주세요.");
      });
  }
}