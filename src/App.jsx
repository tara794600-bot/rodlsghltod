import { useState, useEffect } from 'react'
import './App.css'
import circle from "./assets/2pagecircle.png"
import square from "./assets/2pagesquare.png"
import logo from "./assets/logo.png"
import s1 from "./assets/4pagesqaure1.png"
import s2 from "./assets/4pagesqaure2.png"
import s3 from "./assets/4pagesqaure3.png"
import s4 from "./assets/4pagesqaure4.png"
import phone1 from "./assets/1pagephone.png"
import before from "./assets/before.png"
import after from "./assets/3pageafter.png"
import square2 from "./assets/3pagesquare.png"
import after1 from "./assets/3pageafter1.png"
function App() {
const [isNotPC, setIsNotPC] = useState(false);
  const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const isValid =
  name.trim().length >= 2 &&
  phone.replace(/\D/g, "").length === 11;
const validateForm = () => {
  const cleanPhone = phone.replace(/\D/g, "");

  if (name.trim().length < 2) {
    alert("이름은 2글자 이상 입력해주세요!");
    return false;
  }

  if (cleanPhone.length !== 11) {
    alert("전화번호는 11자리로 입력해주세요!");
    return false;
  }

  return true;
};
useEffect(() => {
    const check = () => {
      setIsNotPC(window.innerWidth < 1024);
    };

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

const formatPhone = (value) => {
  const onlyNums = value.replace(/\D/g, "");

  if (onlyNums.length < 4) return onlyNums;
  if (onlyNums.length < 8)
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;

  return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`;
};
const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    const res = await fetch("/api/survey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phone }),
    });

    const text = await res.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    // ✅ 상태코드 기반 처리
    if (res.status === 200) {
      if (typeof window.gtag_report_conversion === "function") {
        window.gtag_report_conversion();
      }
      alert("신청 완료!");
      setName("");
      setPhone("");
      return;
    }

    if (res.status === 429) {
      alert(data?.error || "이미 신청하셨어요 상담원이 곧 연락드립니다!");
      return;
    }

    if (res.status === 404) {
      alert("신청 API를 찾을 수 없습니다. 서버 배포/연결 상태를 확인해주세요.");
      return;
    }

    alert(data?.error || "서버 오류 발생");
  } catch (error) {
    console.error("상담 신청 요청 실패:", error);
    alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
};
  useEffect(() => {
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("show");
            }
          });
        },
        { threshold: 0.2 }
      );
          const hiddenElements = document.querySelectorAll(".hidden");
      hiddenElements.forEach((el) => observer.observe(el));
  
      return () => observer.disconnect();
    }, []);
  return (
    <>
    <div className="main">
     <section className="sec1 hidden fade-up">

  <div className="sec1-inner">

    {/* 왼쪽 */}
    <div className="left">
      <div className="basic">
        <img src={logo} className="logo"/>
        <h1><strong>베이직론</strong></h1>
      </div>

      <h2 className="title">
        이자 걱정, 이제 그만! <br/>
        최대 <span>3억</span>까지 채무통합
      </h2>

      <div className="info">
        <div><p>최고금액 |</p>
        <p><strong>3억</strong></p>
          </div>
        <div><p>최저금리 |</p>
        <p><strong>4.8%</strong></p> 
        </div>
        <div><p>최장상환</p> <p><strong>10년</strong></p> </div>
      </div>

      <div className="check">
        <p><span>✔</span> 신청 자격 확인 가능</p>
        <p><span>✔</span> 1분 상담 접수</p>
      </div>

      <div className="buttons">
        <button>원클릭 상담</button>
        <button>무료 진단</button>
      </div>
    </div>

    {/* 오른쪽 */}
    <div className="right">
      <img src={phone1} className="phone hidden fade-right delay-2"/>
    </div>

  </div>

  {/* 하단 버튼 */}
  <div >
    <button className="cta"onClick={() => {
  document.getElementById("f").scrollIntoView({
    behavior: "smooth"
  });
}}>
  1분 상담신청 바로가기
</button>
  </div>

</section>
      <section className="sec2">
        <div>
        <h2>풍부한 경험과 노하우를 가진</h2>
        <h2>대환대출 전문가가 도와드리고 있습니다.</h2>
        <p>이런 분들이라면 꼭 확인해보세요</p>
        <p><span>여러분의 고민을 해결해드리겠습니다.</span></p>
        <h1>베이직론의 3가지 POINT</h1>
        </div>
        <img src={circle} className="circle hidden fade-up" alt=" "/>
        <img src={square} className="square hidden fade-up" alt=" "/>
      </section>
      <section className="sec3">
        <h1>| 베이직론을 만난 이후 차익 이자는?</h1>
        <div className="frow">
          <img src={before} className="before" />
          <img 
 src={isNotPC ? after1 : after} 
  className="after"
/>
        </div>
        <img src={square2} className="hidden fade-up" />
      </section>
      <section className="sec4">
        <h2 className="cust">CUSTOMER SUCCESS STORIES</h2>
        <h2><span>고객의 변화를 담은 성공사례를</span></h2>
        <h2><span>한눈에 확인해 보세요.</span></h2>
        <p>단, 회생•회복•파산 진행이력이 5년 이내 있으면 진행이 불가합니다.</p>
        <div className="cards">
          <img src={s1} className="card hidden fade-up "/>
          <img src={s2} className="card hidden fade-up delay-1"/>
          <img src={s3} className="card hidden fade-up delay-2"/>
          <img src={s4} className="card hidden fade-up delay-3"/>
        </div>
      </section>
      <section className="sec5 hidden fade-up" id="f">
        <h1>채무통합 솔루션이 필요하세요?</h1>
        <h2>신용조회 없는 1분 상담으로</h2>
        <h2>높은금리의 대출이자를 절반 이하로 줄여보세요.</h2>
        <form
        onSubmit={(e) => {
    e.preventDefault(); // 🚨 이거 필수
    handleSubmit();
  }}
  style={{
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
    marginTop: 24,
    padding: 32,
    background: "#F5F6FA",
    borderRadius: 20,
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 20
  }}
>
  {/* 제목 */}
  <div
    style={{
      textAlign: "center",
      fontSize: 20,
      fontWeight: 700,
      color: "#4F5DB8",
      lineHeight: 1.5,
      marginBottom: 10
    }}
  >
    정확한 상담을 위해 <br />
    고객정보를 입력해주세요.
  </div>

  {/* 이름 */}
  <div>
    <div style={{ marginBottom: 6, fontWeight: 600,textAlign: "left"}}>
      이름 <span style={{ color: "#4F5DB8" }}>*</span>
    </div>
    <input
  type="text"
  placeholder="이름을 입력하세요."
  value={name}
  onChange={(e) => setName(e.target.value)}
  style={{
    width: "100%",
    padding: "14px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none"
  }}
/>
  </div>

  {/* 연락처 */}
  <div>
    <div style={{ marginBottom: 6, fontWeight: 600,textAlign: "left" }}>
      연락처 <span style={{ color: "#4F5DB8" }}>*</span>
    </div>
    <input
  type="tel"
  placeholder="연락처를 입력하세요."
  value={phone}
  onChange={(e) => setPhone(formatPhone(e.target.value))}
  style={{
    width: "100%",
    padding: "14px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none"
  }}
/>
  </div>

  {/* 버튼 */}
  <button
    type="submit"
    disabled={!isValid}
    style={{
      marginTop: 10,
      padding: "16px",
      borderRadius: 12,
      border: "none",
      background: "#4F5DB8",
      color: "white",
      fontSize: 16,
      fontWeight: 700,
       opacity: isValid ? 1 : 0.5,
    cursor: isValid ? "pointer" : "not-allowed"
    }}
  >
    무료 상담신청
  </button>

  {/* 하단 안내 */}
  <div
    style={{
      textAlign: "center",
      fontSize: 13,
      color: "#777",
      marginTop: 10
    }}
  >
    신청 즉시, 10분이내 유선 상담 진행
  </div>
</form>
      </section>
      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <p>사업자명: 에스비컨설팅 대부중개 사이트명: 지원대출센터</p>
          <p>사업자등록번호: 243-07-03020 대표자: 엄원진</p>
          <p>사업장소재지: 서울특별시 도봉구 도봉로165길 14, 3층 312호(도봉동,퍼스트빌오피스텔)</p>
          <p>등록 기관 : 서울 도봉 지방자치단체 02-2091-2883</p>
          <p>대부중개업등록번호: 2025-서울도봉-0001</p>
          <br />
          <p>광고되는 대출 상품들의 상환기간은 모두 12개월 이상이며, 최장 상환기간은 120개월입니다.</p>
          <p>대출금리: 연 5.9%~연 20%이내 (산출기준: 고객의 개인신용평점 등에 따라 달리 적용)</p>
          <p>연체이율: 연 5.9%~연 20%이내</p>
          <p>중도상환조건 : 대출실행일로부터 1년 이내 상환시 최대 대출금 2% 적용, 단 이자와 중도상환 수수료의 합산액은 20%를 초과하지 않음.</p>
          <p className="legal-strong">『중개수수료를 요구하거나 받는 것은 불법으로 대출과 관련된 일체의 수수료를 받지 않습니다.』</p>
          <p>* 60일내 전액 상환 요구 없습니다. (개인대출 아님)</p>
          <p>* 본 업자는 금융소비 정보포털 파인에서 조회 가능합니다.</p>
          <br />
          <p>대출 총 비용 예시는 다음과 같습니다.</p>
          <p>100만원을 12개월동안 최대 연이자율 20%로 대출할 시 총 상환금액 1,111,614원 (대출상품에 따라 달라질 수 있습니다.)</p>
          <p>중개수수료를 요구하거나 받는 것은 불법입니다.</p>
          <p>과도한 빚은 큰 불행을 안겨줄 수 있습니다.</p>
          <br />
          <p>해당 콘텐츠는 저작권법으로 보호되는 바, 영리목적으로 무단사용시 관련법에 의거하여 처벌받을 수 있습니다.</p>
          <p>홈페이지 무단 복제 사용시 이미지 저작권 및 폰트 저작권으로 민형사상 처벌될 수 있습니다.</p>
          <p className="legal-copy">Copyright ⓒ All rights 지원대출센터 reserved.</p>
        </div>
      </footer>

    </div>
    </>
  )
}

export default App
