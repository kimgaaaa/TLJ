# 마크업 & 클래스 네이밍 컨벤션

> Figma 레이어 이름을 그대로 HTML/CSS로 옮길 수 있게 짓는다.
> 레이어 이름 = 선택자. 이 문서는 그 규칙을 정리한다.

---

## 1. 기본 원칙

- 클래스명은 **케밥케이스**로 쓴다. `best-item` `faq-container` `return-shipping-address`
- 의미가 있는 곳엔 **시맨틱 태그**를 먼저 쓴다. div는 최후의 수단이다.
- 레이어 이름은 **CSS 선택자 문법**으로 짓는다. 코드로 옮길 때 해석이 필요 없게 한다.
- 클래스명은 **생김새가 아니라 역할**로 짓는다. `.red-box` ✕ `.promotion` ○

---

## 2. 레이어 이름 표기법

| 표기 | 의미 | 예시 |
|---|---|---|
| `태그` | 클래스 없는 태그 | `header` `nav` `footer` `p` `video` |
| `태그.클래스` | 태그 + 클래스 | `section.best-item` `h1.logo` `strong.price` |
| `.클래스` | div + 클래스 | `.inner` `.title` `.product-info` |
| `태그.클래스.클래스` | 클래스 여러 개 | `section.inner.faq-sec` `span.page.active` |
| `태그#아이디` | 페이지에 하나뿐인 요소 | `video#hero` `form#search` |
| `부모>자식` | 자식이 단순할 때 한 레이어로 묶기 | `li>a` `h3>a` |
| `태그[속성]` | 속성이 중요한 요소 | `input[type="search"]` |
| `::가상요소` | 가상요소 | `::after` `::placeholder` |
| `태그::가상요소` | 특정 요소의 가상요소 | `span::after` |
| `img (경로)` | 인라인 이미지. 괄호 안은 파일 경로 | `img (list/thumb/yoga.jpg)` |
| `태그 (bg: 파일)` | CSS 배경 이미지 | `button.all-menu (bg: icons/burger-wh.svg)` |
| `태그 (파일)` | 태그 안에 들어가는 이미지 | `a (logo.svg)` |
| `태그 (span)` | 안에 span 강조가 들어감 | `h1 (span)` |
| `(#위치) 선택자` | 앞 괄호는 배치 메모 | `(#left) .slogan-container` |

괄호 `( )` 안 내용은 **주석**이다. 코드에는 선택자 부분만 옮긴다.

---

## 3. 페이지 골격

```html
<div class="scroll-progress"><div class="bar"></div></div>

<header>
  <h1 class="logo"><a href="/">브랜드</a></h1>
  <nav>…</nav>
  <div class="sub-menu">…</div>
</header>

<main>
  <section class="hero"></section>
  <section class="intro-section">
    <article class="app-intro">…</article>
  </section>
</main>

<footer>
  <div class="inner">…</div>
  <p class="copyright">…</p>
</footer>
```

- 최상위는 `header` / `main` / `footer` 세 덩어리다.
- 콘텐츠 블록은 `section.블록이름`으로 쌓는다.
- 섹션 안에서 독립적인 콘텐츠 덩어리는 `article`로 나눈다. `article.service` `article.preview`
- 첫 섹션은 `section.hero`다. 배경 이미지만 있으면 자식 없이 `(bg: 파일)`로 처리한다.
- 페이지 상단 스크롤 진행 막대는 `.scroll-progress > .bar`다.

---

## 4. 레이아웃: `.inner`

- 전체 폭 섹션은 1920을 쓰고 콘텐츠는 `.inner` 안에 넣는다.
- 배경이 필요 없는 섹션은 section 자체에 `inner`를 합친다.

```html
<!-- 배경 있는 섹션 -->
<section class="challenge"><div class="inner">…</div></section>

<!-- 배경 없는 섹션: 합치기 -->
<section class="inner faq-sec">…</section>

<!-- 목록이 컨테이너 역할: 합치기 -->
<ul class="categories inner">…</ul>
```

- 합칠 때 순서는 `태그.inner.이름`으로 쓴다.
- 섹션 간격은 `.inner`의 `padding-bottom`으로 준다.

---

## 5. 로고

로고는 항상 `h1.logo > a` 구조다.

```html
<h1 class="logo">
  <a href="/"><img src="images/logo-wh.svg" alt="브랜드명"></a>
</h1>
```

- 배경 이미지로 처리할 땐 `a` 안에 브랜드명 텍스트를 남기고 CSS로 숨긴다.
- 푸터 로고는 `h1`이 아니다. `.footer-logo > a`로 만든다.

---

## 6. 제목 계층

- 로고: `h1.logo`
- 섹션 제목: `h2` (권장. 아래 "결정 필요" 참고)
- 섹션 안 항목 제목: `h3` (카드 제목, FAQ 질문, 푸터 링크 묶음)
- 제목 단계를 건너뛰지 않는다. h2 없이 h3를 쓰지 않는다.

### 섹션 제목 블록

제목과 부가 요소는 `.title`로 묶는다.

```html
<div class="title">
  <h2>자주 묻는 질문</h2>
  <a class="more-faq" href="#">더 보러 가기</a>
</div>
<p class="subject">…</p>
```

### 제목 강조 장식

제목 일부를 강조하고 밑에 장식을 깔 때는 `span` + `::after`를 쓴다.

```html
<h2>상상하는 것은 <span>무엇이든</span></h2>
```
```css
h2 span { position: relative; }
h2 span::after { content: ""; background: url(deco.svg) no-repeat; }
```

- 흰색 버전 장식은 파일명에 `-wh`를 붙인다. `deco.svg` / `deco-wh.svg`

---

## 7. 네비게이션

### 단순 메뉴

```html
<nav>
  <a href="#">여성</a>
  <a href="#">남성</a>
</nav>
```

### 드롭다운 메뉴

메뉴 하나를 역할 클래스로 감싼다. 1차는 `a.menu`, 2차는 `ul.drop`이다.

```html
<nav>
  <div class="about">
    <a class="menu" href="#">회사소개</a>
    <ul class="drop">
      <li><a href="#">…</a></li>
    </ul>
  </div>
  <div class="try-it">
    <a class="menu" href="#">체험하기 <span class="new">N</span></a>
    <ul class="drop">…</ul>
  </div>
</nav>
```

### 헤더 유틸 영역

로그인·장바구니·전체메뉴 같은 보조 기능은 따로 묶는다.

```html
<div class="sub-menu">
  <button class="all-menu" aria-label="전체메뉴"></button>
  <button class="global" aria-label="언어 선택"></button>
  <a class="go-contact" href="#">제품 문의하기</a>
</div>
```

---

## 8. 목록과 카드

반복되는 항목은 `ul > li > a` 구조다. `li` 안에 `a`만 있으면 Figma에선 `li>a` 한 레이어로 둔다.

### 상품 카드

```html
<ul class="item-list">
  <li>
    <a href="#">
      <img src="images/sample.jpg" alt="">
      <div class="product-info">
        <p class="name">상품명</p>
        <strong class="price">39,000원</strong>
      </div>
    </a>
  </li>
</ul>
```

- 상품명은 `p.name`, 가격은 `strong.price`다.
- 텍스트와 같은 내용인 이미지는 `alt`를 비운다.

### 썸네일 박스: `th-`

`a > img`만 감싸는 이미지 박스는 `th-` 접두사를 쓴다. 대시 뒤엔 크기나 용도를 쓴다.

```html
<div class="th-medium">
  <a href="#"><img src="images/list/thumb/sample.jpg" alt=""></a>
</div>
```

**상품 썸네일은 크기로 짓는다.**

| 클래스 | 크기 |
|---|---|
| `th-xsmall` | 가장 작음 |
| `th-small` | 작음 |
| `th-regular` | 보통보다 작음 |
| `th-medium` | 보통 |
| `th-large` | 큼 |
| `th-xlarge` | 가장 큼 |

- 기본은 `small` / `regular` / `medium` / `large` 네 단계다.
- 더 작거나 크면 `x`를 붙인다. 더 필요하면 `xx`를 붙인다. `th-xxlarge`

**상품이 아니면 용도로 짓는다.** `th-user` `th-cate`

- 조건은 `div > a > img` 단독 구조다. 텍스트가 같이 들어가면 `th-`를 쓰지 않는다.

### 이미지 카드 (캡션 포함)

```html
<li class="swiper-slide">
  <figure>
    <img src="images/list/thumb/yoga.jpg" alt="">
    <figcaption>
      <img src="images/icons/yoga.svg" alt="">
      <h3>…</h3>
      <a class="more" href="#">자세히</a>
    </figcaption>
  </figure>
</li>
```

- `figure`를 쓰면 설명은 반드시 `figcaption`에 넣는다.

### 이미지만 있는 그리드

```html
<section class="insta">
  <a href="#"><img src="images/feed1.jpg" alt="…"></a>
</section>
```

---

## 9. 이미지 처리

| 상황 | 처리 | 레이어 표기 |
|---|---|---|
| 콘텐츠 이미지 (상품, 썸네일, 피드) | `<img>` | `img (경로)` |
| 로고 | `<img>` 또는 배경 | `a (logo.svg)` / `a (bg: logo-wh.svg)` |
| UI 아이콘 (검색, 메뉴, 링크 화살표) | CSS 배경 | `태그 (bg: 파일)` |
| 콘텐츠 옆 의미 있는 아이콘 | `<img>` | `img (icons/yoga.svg)` |
| 장식 (밑줄, 도형) | `::after` 배경 | `::after (deco.svg)` |
| 섹션 배경 | section 배경 | `section.이름 (bg: 파일)` |

기준은 하나다. **이미지가 빠지면 내용이 사라지는가?** 그렇다면 `img`, 아니라면 배경이다.

### 이미지 폴더 구조

```
images/
├── logo.svg, logo-wh.svg
├── icons/          UI 아이콘
├── categories/     카테고리 썸네일
└── list/
    ├── thumb/      목록 썸네일 (jpg)
    └── svg/        목록 아이콘 (svg)
```

- 흰색 버전은 `-wh` 접미사다.
- 폴더는 **용도별**로 나눈다.

---

## 10. button vs a

- **페이지를 이동하면 `a`**
- **화면 안에서 뭔가 바뀌면 `button`**

| 요소 | 태그 | 이유 |
|---|---|---|
| 전체메뉴 열기 | `button.all-menu` | 패널 열기 |
| 언어 선택 | `button.global` | 드롭다운 열기 |
| 탭 전환 | `button.tab` | 내용 전환 |
| 문의·계정 이동 | `a.go-contact` `a.go-account` | 페이지 이동 |

### 링크 이름 규칙

- 다른 페이지로 보내는 링크는 `go-` 접두사다. `a.go-contact` `a.go-service` `a.go-sns`
- 더보기 링크는 `a.more`다. 한 페이지에 여러 개면 `a.more-대상`이다. `a.more-faq`

---

## 11. 배지와 알림 점

| 용도 | 마크업 |
|---|---|
| 숫자 배지 | `span.count` |
| 신규 배지 | `span.new` |
| 알림 점 (텍스트 없음) | 해당 `a`의 `::after` |

```css
a.has-dot::after { content: ""; width: 5px; height: 5px; border-radius: 50%; }
```

---

## 12. 폼

```html
<form id="search">
  <input type="search" placeholder="검색어를 입력하세요">
  <input type="submit" value="검색">
</form>
```

- 폼과 입력 요소는 태그·속성 선택자로 이름 짓는다.
- 아이콘 버튼이어도 `value`는 남기고 CSS로 글자를 숨긴다.

---

## 13. FAQ

질문·답변 쌍은 `details` / `summary`를 쓴다.

```html
<div class="faq-container">
  <details class="question">
    <summary><h3>질문</h3></summary>
    <p>답변</p>
  </details>
</div>
```

---

## 14. 상태 클래스

- 상태는 **기본 클래스 + 상태 클래스** 조합으로 붙인다.
- 상태 클래스만 단독으로 스타일을 주지 않는다. `.page.active` ○ `.active` ✕
- 라이브러리가 붙이는 상태 클래스는 그대로 쓴다. `.swiper-slide-active`

---

## 15. Swiper

라이브러리 필수 클래스 뒤에 내 클래스를 붙인다. 스타일은 내 클래스로 준다.

```html
<div class="swiper challenge-list">
  <ul class="swiper-wrapper">
    <li class="swiper-slide">…</li>
  </ul>
</div>
<div class="swiper-pagination"></div>
```

- 구조는 `.swiper > .swiper-wrapper > .swiper-slide` 3단이다.
- 목록 성격이면 `ul.swiper-wrapper > li.swiper-slide`로 쓴다.
- 이미지만 넘기면 `img.swiper-slide`로 줄인다.
- 내 클래스는 `-slider` 접미사를 기본으로 한다. `frame-slider` `word-slider`

---

## 16. 푸터

```html
<footer>
  <div class="inner">
    <div class="footer-intro">
      <h2 class="foot">상상하는 것은 무엇이든 <span>Boost Up.</span></h2>
      <div class="policy"><a href="#">이용약관</a> …</div>
    </div>
    <div class="footer-main">
      <div class="brand-about">
        <div class="footer-logo"><a href="/">…</a></div>
        <ul>
          <li class="title">서비스</li>
          <li><a href="#">…</a></li>
        </ul>
      </div>
      <div class="brand-link"><h3><a href="#">…</a></h3></div>
      <div class="brand-cs">
        <p class="title">고객센터</p>
        <p class="hour">…</p>
      </div>
    </div>
  </div>
  <p class="copyright">…</p>
</footer>
```

- 푸터 영역은 `footer-` 접두사다. `footer-intro` `footer-main` `footer-logo`
- 브랜드 정보 블록은 `brand-` 접두사다. `brand-about` `brand-link` `brand-cs` `brand-info`
- 목록 제목은 `li.title` 또는 `p.title`이다.
- 저작권은 `p.copyright`, 사이트맵은 `.sitemap`, SNS는 `.go-sns`다.

---

## 17. 반응형 변형

- PC 프레임은 `PC`, 모바일 프레임은 `M`으로 이름 짓는다.
- 모바일 전용 요소는 `-m` 접미사를 붙인다. `.login-container-m`

---

## 18. 이름 짓기 세부 규칙

- 영어 단어로 짓는다. 줄임말은 아래 목록만 쓴다.
- 여러 개를 감싸는 컨테이너는 복수형이다. `categories`
- 한 요소는 단수형이다. `count` `logo` `price`

### 접미사

| 역할 | 접미사 | 예시 |
|---|---|---|
| 섹션 | 없음 | `section.faq` `section.service` |
| 묶음 래퍼 | `-container` | `faq-container` `slogan-container` |
| 목록 | `-list` | `item-list` |
| 슬라이더 | `-slider` | `frame-slider` `word-slider` |
| 유틸 영역 | `-util` / `-menu` | `sub-menu` `user-menu` |
| 흰색 에셋 | `-wh` | `logo-wh.svg` |
| 모바일 전용 | `-m` | `login-container-m` |

### 접두사

| 역할 | 접두사 | 예시 |
|---|---|---|
| 이동 링크 | `go-` | `go-contact` `go-service` |
| 푸터 영역 | `footer-` | `footer-intro` |
| 브랜드 정보 | `brand-` | `brand-cs` |

### 허용 줄임말

| 줄임말 | 원래 |
|---|---|
| `th` | thumbnail (클래스 접두사 `th-`) |
| `thumb` | thumbnail (이미지 폴더명) |
| `cate` | category |
| `util` | utility |
| `cs` | customer service |
| `wh` | white |

---

## 19. 클래스명 단어장

★ 표시는 지금 파일들에서 이미 쓰고 있는 단어다. 새 이름이 필요하면 이 표에서 먼저 찾는다.

### 레이아웃·래퍼

| 단어 | 쓰임 |
|---|---|
| `inner` ★ | 가운데 정렬 콘텐츠 폭 |
| `container` ★ | 여러 요소를 묶는 래퍼 (`-container`) |
| `wrap` | 한 요소를 감싸는 래퍼 (`img-wrap`) |
| `group` | 성격이 같은 요소 묶음 (`btn-group`) |
| `box` | 테두리·배경이 있는 덩어리 (`text-box`) |
| `area` | 화면의 특정 영역 (`search-area`) |
| `left` / `right` | 2단 레이아웃 좌우 |
| `col` | 다단 레이아웃의 한 칸 |

### 섹션 이름

| 단어 | 쓰임 |
|---|---|
| `hero` ★ | 첫 화면 대형 비주얼 (메인 비주얼) |
| `intro` ★ | 소개 |
| `promotion` ★ | 기획전·이벤트 배너 |
| `best-item` ★ | 인기 상품 |
| `new-arrival` | 신상품 |
| `recommend` | 추천 |
| `review` | 후기 |
| `notice` | 공지 |
| `faq` ★ | 자주 묻는 질문 |
| `brand-story` | 브랜드 소개 |
| `banner` | 가로 띠 배너 |
| `insta` ★ | 인스타그램 피드 |
| `newsletter` | 구독 폼 |

### 헤더·내비게이션

| 단어 | 쓰임 |
|---|---|
| `logo` ★ | 로고 |
| `gnb` | 전역 메인 메뉴 (nav 대신 클래스가 필요할 때) |
| `menu` ★ | 메뉴 항목 |
| `drop` ★ | 드롭다운 하위 메뉴 |
| `sub-menu` ★ | 보조 메뉴 |
| `user-menu` ★ | 로그인·장바구니 등 사용자 메뉴 |
| `all-menu` ★ | 전체메뉴 버튼 |
| `breadcrumb` | 현재 위치 경로 |

### 텍스트

| 단어 | 쓰임 |
|---|---|
| `title` ★ | 제목 또는 제목 묶음 |
| `sub-title` | 부제목 |
| `subject` ★ | 제목 아래 설명 |
| `desc` | 일반 설명문 |
| `label` | 짧은 분류 표시 |
| `caption` | 이미지 설명 |
| `date` | 날짜 |
| `copyright` ★ | 저작권 |

### 상품·카드

| 단어 | 쓰임 |
|---|---|
| `item-list` ★ | 상품 목록 |
| `item` | 상품 하나 |
| `card` | 카드형 블록 |
| `thumb` ★ | 썸네일 |
| `product-info` ★ | 상품 정보 묶음 |
| `name` ★ | 상품명 |
| `price` ★ | 가격 |
| `sale` | 할인가·할인율 |
| `origin-price` | 할인 전 가격 |
| `tag` | 태그 |
| `rating` | 별점 |

### 링크·버튼

| 단어 | 쓰임 |
|---|---|
| `go-대상` ★ | 다른 페이지로 이동 |
| `more` ★ | 더보기 |
| `btn` | 일반 버튼 (`btn-primary`) |
| `prev` / `next` | 이전·다음 |
| `close` | 닫기 |
| `open` | 열기 |
| `toggle` | 열고 닫기 전환 |
| `top` | 맨 위로 |

### 배지·표시

| 단어 | 쓰임 |
|---|---|
| `count` ★ | 숫자 배지 |
| `new` ★ | 신규 배지 |
| `badge` | 일반 배지 |
| `dot` | 알림 점 |

### 슬라이드·탭·팝업

| 단어 | 쓰임 |
|---|---|
| `slider` ★ | 슬라이더 (`-slider`) |
| `tab` ★ | 탭 버튼 |
| `tab-content` | 탭 내용 |
| `page` ★ | 페이지네이션 번호 |
| `modal` | 화면 중앙 팝업 |
| `popup` | 새 창·레이어 팝업 |
| `overlay` | 팝업 뒤 어두운 배경 |

### 푸터

| 단어 | 쓰임 |
|---|---|
| `policy` ★ | 약관 링크 |
| `sitemap` ★ | 사이트맵 |
| `sns` ★ | SNS 링크 |
| `cs` ★ | 고객센터 |
| `brand-info` ★ | 사업자 정보 |

### 상태

| 단어 | 쓰임 |
|---|---|
| `active` ★ | 현재 선택됨 |
| `on` | 켜짐 (`active`와 섞어 쓰지 않는다) |
| `disabled` | 비활성 |
| `hidden` | 숨김 |
| `fixed` | 스크롤 시 고정 |
| `sold-out` | 품절 |

### 피해야 할 이름

| 피할 이름 | 이유 | 대신 |
|---|---|---|
| `red` `big` `left-box` | 생김새라 디자인이 바뀌면 틀린 이름이 된다 | 역할로 짓기 |
| `box1` `box2` | 무엇인지 알 수 없다 | `intro` `review` |
| `div` `section` | 태그 이름과 겹친다 | 역할로 짓기 |
| `menu_list` `MenuList` | 케밥케이스가 아니다 | `menu-list` |
| `jeonche-menu` | 로마자 표기는 읽기 어렵다 | `all-menu` |
| `ad` `ads` `banner-ad` | 광고 차단 프로그램이 숨긴다 | `promotion` |

---

## 20. Figma 작업 체크리스트

- [ ] `Frame 123` 같은 기본 이름이 남아 있지 않다.
- [ ] 이미지 레이어가 `sample2` `wishxcrocs 1 copy 1`처럼 남아 있지 않다. `img (경로)`로 바꾼다.
- [ ] 배경 이미지는 `(bg: 파일)`로 표기했다. `(파일)`만 쓰면 인라인 이미지다.
- [ ] 아이콘 레이어 이름이 공백(`" "`)이 아니다.
- [ ] 안 쓰는 숨긴 레이어는 지웠다.
- [ ] 좌표·크기에 소수점이 없다.
- [ ] `ul` 바로 아래엔 `li`만 있다.
- [ ] `figure`에는 `figcaption`이 있다.
- [ ] 제목 단계를 건너뛰지 않았다.

---

## 결정 필요

지금 파일들에서 방식이 갈리는 부분이다. 하나로 정한 뒤 이 섹션을 지운다.

1. **섹션 제목 태그** — 현재는 섹션마다 `h1`을 쓰고 있다. 섹션별 h1은 HTML5 아웃라인 알고리즘을 전제로 한 방식인데 이 알고리즘은 브라우저·스크린리더가 구현하지 않았고 표준에서 삭제됐다. 문서는 `h2`로 적어 두었다.
2. **섹션 클래스 접미사** — `service-section` `intro-section` `faq-sec` `challenge`가 섞여 있다. 문서는 접미사 없음으로 적어 두었다.
3. **활성 상태 클래스** — `.tab-active`(crocs)와 `.active`(boost)가 섞여 있다. 문서는 `.active` 조합으로 적어 두었다.
4. **모바일 표기 위치** — `section.m-login`(접두사)과 `.login-container-m`(접미사)이 섞여 있다. 문서는 접미사로 적어 두었다.
5. **유틸 영역 이름** — `.users-util` `.user-menu` `.sub-menu`가 같은 역할이다.
