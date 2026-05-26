const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const PORT = process.env.PORT || 3000;

const HOTEL_KNOWLEDGE = `
You are a friendly AI concierge for a hotel in Okinawa, Japan — powered by NiteBot.

PROPERTY INFORMATION:
- Name: [Hotel Name]
- Address: [Hotel Address], Okinawa, Japan
- Phone: [Phone Number]
- Email: [Email Address]
- Front desk hours: [e.g. 9:00 AM – 8:00 PM]
- After-hours: Guests should contact the property in advance for late arrivals

CHECK-IN / CHECK-OUT:
- Check-in: [e.g. 3:00 PM] — early check-in available on request
- Check-out: [e.g. 11:00 AM] — late check-out available on request
- Please confirm your arrival time with staff in advance

LOCATION:
- Located in Okinawa, Japan
- [Nearest station or landmark and walking time]
- [Distance from Naha Airport]

AMENITIES:
- Free WiFi throughout the property
- [List key amenities — e.g. parking, kitchen, laundry, lounge, etc.]

ROOMS:
- [Describe available room types — e.g. private rooms, dormitory, tatami rooms, etc.]

HOUSE RULES:
- Please be respectful of other guests in shared spaces
- [Any specific rules — shoes at entrance, quiet hours, etc.]

NEARBY:
- [List nearby attractions, restaurants, beaches, transport, etc.]

LANGUAGE RULE — CRITICAL:
Detect the language the guest is writing in and ALWAYS reply in that exact same language.
English → reply in English
Japanese → reply in Japanese (日本語)
Korean → reply in Korean (한국어)
Chinese → reply in Chinese (中文)

STYLE: Warm, friendly, and concise. Short paragraphs easy to read on a phone. Feel like a helpful local friend, not a robot. Always make the guest feel welcome.
If you don't know something specific, say: "Please ask our staff directly — we're always happy to help!"
Never make up information not listed above.
`;

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NiteBot — AI Hotel Concierge</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --teal:        #2bb5b5;
    --teal-light:  #3dd4d4;
    --teal-dark:   #1a9494;
    --teal-dim:    rgba(43,181,181,0.12);
    --bg:          #eaf6f7;
    --white:       #ffffff;
    --text:        #1a2e35;
    --muted:       #8aabb5;
    --border:      #cce5ea;
    --bubble-bot:  #ffffff;
    --bubble-user: linear-gradient(135deg, #2bb5b5, #3dd4d4);
  }

  html, body { height: 100%; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(145deg, #dff2f4 0%, #eaf6f7 40%, #f5fbfb 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100%;
    padding: 1rem;
  }

  .chat-container {
    width: 100%;
    max-width: 420px;
    background: var(--bg);
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(43,181,181,0.2);
    box-shadow:
      0 4px 24px rgba(43,181,181,0.15),
      0 1px 4px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    height: min(620px, 100vh);
    position: relative;
    z-index: 1;
  }

  /* Header */
  .chat-header {
    background: linear-gradient(135deg, #2bb5b5 0%, #1fa0a0 100%);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .header-icon {
    width: 46px; height: 46px;
    border-radius: 12px;
    background: #0a1628;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }

  .header-icon img {
    width: 38px; height: 38px;
    object-fit: contain;
  }

  .header-info { flex: 1; min-width: 0; }

  .header-name {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .online-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 6px rgba(74,222,128,0.7);
    animation: pulse 2s infinite;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .header-sub {
    font-size: 11px;
    color: rgba(255,255,255,0.75);
    margin-top: 2px;
  }

  .lang-btns {
    display: flex;
    gap: 5px;
    flex-shrink: 0;
  }

  .lang-btn {
    font-size: 11px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    padding: 4px 9px;
    border-radius: 20px;
    border: 1.5px solid rgba(255,255,255,0.5);
    background: transparent;
    color: rgba(255,255,255,0.85);
    cursor: pointer;
    transition: all 0.2s;
  }

  .lang-btn.active {
    background: #ffffff;
    color: var(--teal-dark);
    border-color: #ffffff;
  }

  .lang-btn:hover:not(.active) {
    background: rgba(255,255,255,0.2);
    color: #ffffff;
  }

  /* Messages */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--bg);
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .message {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    animation: fadeUp 0.25s ease;
  }

  .msg-content {
    display: flex;
    flex-direction: column;
    max-width: 80%;
  }

  .message.user { flex-direction: row-reverse; }
  .message.user .msg-content { align-items: flex-end; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .msg-avatar {
    width: 30px; height: 30px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  .message.bot .msg-avatar {
    background: #0a1628;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }

  .message.bot .msg-avatar img {
    width: 24px; height: 24px;
    object-fit: contain;
  }

  .message.user .msg-avatar {
    background: var(--teal-dim);
    border: 1.5px solid var(--border);
    font-size: 10px;
    font-weight: 600;
    color: var(--teal-dark);
    border-radius: 50%;
  }

  .msg-time {
    font-size: 9px;
    color: var(--muted);
    margin-top: 4px;
    padding: 0 4px;
    align-self: flex-end;
  }

  .message.user .msg-time { text-align: right; }

  .bubble {
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .message.bot .bubble {
    background: var(--bubble-bot);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 14px 14px 14px 3px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .message.user .bubble {
    background: var(--bubble-user);
    color: #ffffff;
    font-weight: 500;
    border-radius: 14px 14px 3px 14px;
    border: none;
    box-shadow: 0 2px 10px rgba(43,181,181,0.35);
  }

  .msg-content .bubble { max-width: 100%; }

  /* Typing */
  .typing .bubble {
    background: var(--bubble-bot);
    border: 1px solid var(--border);
    border-radius: 14px 14px 14px 3px;
    padding: 13px 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .typing-dots { display: flex; gap: 5px; align-items: center; }
  .typing-dots span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--teal);
    opacity: 0.6;
    animation: bounce 1.2s infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%,60%,100% { transform: translateY(0); opacity: 0.6; }
    30% { transform: translateY(-5px); opacity: 1; }
  }

  /* Quick replies */
  .quick-replies {
    padding: 8px 12px;
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    border-top: 1px solid var(--border);
    background: var(--white);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .quick-replies::-webkit-scrollbar { display: none; }

  .quick-reply {
    font-size: 11px;
    font-family: 'Inter', sans-serif;
    padding: 6px 13px;
    border-radius: 20px;
    background: var(--white);
    border: 1.5px solid var(--teal);
    color: var(--teal-dark);
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.01em;
    white-space: nowrap;
    flex-shrink: 0;
    font-weight: 500;
  }

  .quick-reply:hover {
    background: var(--teal);
    color: white;
  }

  /* Input */
  .input-area {
    padding: 10px 12px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    align-items: center;
    background: var(--white);
  }

  .input-area input {
    flex: 1;
    padding: 9px 14px;
    border: 1.5px solid var(--border);
    border-radius: 24px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    outline: none;
    background: var(--bg);
    color: var(--text);
    transition: border-color 0.2s;
  }

  .input-area input::placeholder { color: var(--muted); }
  .input-area input:focus { border-color: var(--teal); background: #fff; }

  .send-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2bb5b5, #3dd4d4);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(43,181,181,0.4);
  }

  .send-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 16px rgba(43,181,181,0.55);
  }

  .send-btn svg {
    width: 16px; height: 16px;
    fill: #ffffff;
  }

  /* Footer */
  .powered-by {
    text-align: center;
    font-size: 10px;
    color: var(--muted);
    padding: 6px;
    border-top: 1px solid var(--border);
    letter-spacing: 0.06em;
    background: var(--white);
  }

  .powered-by strong { color: var(--teal-dark); font-weight: 600; }
</style>
</head>
<body>
<div class="chat-container">

  <!-- Header -->
  <div class="chat-header">
    <div class="header-icon">
      <img src="data:image/png;base64,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" alt="NiteBot"/>
    </div>
    <div class="header-info">
      <div class="header-name">
        NiteBot <div class="online-dot"></div>
      </div>
      <div class="header-sub">AI Hotel Concierge · AIコンシェルジュ</div>
    </div>
    <div class="lang-btns">
      <button class="lang-btn active" onclick="switchLang('en')">EN</button>
      <button class="lang-btn" onclick="switchLang('ja')">日</button>
      <button class="lang-btn" onclick="switchLang('ko')">한</button>
      <button class="lang-btn" onclick="switchLang('zh')">中</button>
    </div>
  </div>

  <!-- Messages -->
  <div class="messages" id="messages">
    <div class="message bot">
      <div class="msg-avatar"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAIAAAABc2X6AAAViUlEQVR4nLU8B5wU1d3vvSnb9+64QpMoR1M4DSIa4RSIsR9iISIWEvyIouDHTxErBrFA6IIFPk2MaFCCSiygoCgR8gVFgQNBOlxDjjuu7N1tmZ2Z915+b2Z3b3d2Zhvkf3g3O/PKv7c3K7R36Q0ABZ0ADX+NQFPfNZtmtdRZgQR8aNrNUPQCpiYosz2TN8tmNZr9/jRr1iLzHVJMND6Kn07NR9OMyTgjai0AJuCMEmdHHyavZdD6s66lqfmWenwKgMYbfBrc0+ORsS2ksC+a2+D0Fgvih0D2kU81NDuA6ZmQAYZpBtNkIcA0q9OEC2uCUwDM1bslm0YuczVJmczPaDmU5Z6J28Ubcw5WnTKWJQwwQSLdfibPKQAUWWheyg0NEk4WeArhZ8ujeA+f+URzagEAkLcIf/E0wwTBmoolQ5rTY5ys8RoCiTHE8NB4Yb471O+iTHUx2SMkL516JZht/pCEtUWYN5lhEAbs/BSTcDqISTgtBjRLlpkPjV8x5SKG3S3mAfaRaUpaCUefpmCLIZHKUJKp+AxTLaRvl1uMgJZeOvsaIJ2nSxhpWYHo+kcz8sfJbicDLqDoqqYEZRlqMtnSWNxkNi0tzSkuEiGWeBhozk1jsgJTMzDbN7XdWmFqMQV1Pk4YYaFJZ1IzJMxNLRFt9xgKKRyhKaQczCehkhbXjCFZbEbUDV7VNGHMFSz0gs96fXhmNVrkGppx4ezVnDHnAI1PEouHHIg3pDiZL2IqXasVMk+24xMvajKDN9sp0/zAZGw8C7KCbA3VdGJi6Wuh0tbr6JApGmeuj7mxKQWzqKlKm42OrAMj7R72ky0SOYKpcmewO8wqLMH4MKRTCRBCGKuEYMQhjfLkf1ar5kxxbE1DUDybPTSUdIcyD0pJoKPNbrdxHBfwtRJCEUoeGW8oBkbEDYIQaXA2ZAQR4hDSBWAYac0gmjAUGT6zsYwQPOeFWdu3bNy66dPZzz7DQxIKBTmet0jeLdkPIZRlOdjhDwaCkNFsNTK9ACFEEIJgMBAMhcJSGABIM2xHQAPBhqeIk0Lh0tLeD02ZXNy1uF+/vk8/8fCqlX/pX3puoLWV47g47qZxxxBCrOLCgry333xt0sS7Qs3NTDQQRbHX/8Hob0sAAHIchwkOdbRPvf++ZQvn9+rZnWCs5WJWPRFL4DuRj4ynlFJe4PyBDkXGS1+ef+01V185YtjqVW/NWbBo7Qef2JwunucxwUlROEGpILMLIPD83/76+rVXlY+9taJXzx7P/2kxL9h4nlcUhVKDaukFq75W5yMIAOKEQCDgdPAvzp93680VTqfL4XY+/PAMTKP+JmNqAYBQO1uKjKcAIIikYKisbMBnn37II/7W22+vOlY1e/azI0ddSQH96KN1Cxe+1O4PuNxejAkAxLBcPP5MwkQd0Kd0yfw55cMv5jjh7VUfTH/8j/5AoCA/X+AFbTKlgBBKIWUTKKWaSBnTtWyaLRiWw716dHt+9h+HDhkiydLGL75e/NLLTc2tZuEofQYBGcFxRT6CKByUBpX1X/fx+4CCeydN/ueWbaJNuHP8bb+75+6S4sID+w/PWbBoz45KR16Bhi+xCPNaAwnxQX+gIM89b+6ssbeMRjz8dvsPIi/+8qILEUSMKkIJwJgQitlSGBOMtV8qxoQCShVVbWxqLi4q9uZ5AyHplddWvPX2KohEXuApITkQzMeP0T0W00ZC2YaYyGGZE0S7w/H2yncPHjgyderk/v36LVk0768r31m9+kOOF0VRxFhXbwPHNfMgxOVxhbA6edLUPXsPPjbjoeG/uqytvWN35Y8MWUIJk66m3PovAlRGdQQwJoIglJUN6mhrb2hsen7unzZ+usFdVMIwY9TmArzhs+b7qEpUlWBEGP6EKISInvzC7Tsqqx9/5sHJ911++dD77/394IFlC5e+0ni62e31YlWlgKklhQlJCoWEecH2YOE53cuHX15cWFh38uSNo8dWHTkOBFEbmejtdaOM5T0IUUUZe9ttkydP8gf855xznquoUFFknme5gbaTjq9VmQWTqjPWpk0cACmAlFCgqoQjzJjYLUoxVtxub4uv48W588bf8dtbxoy+ZOjg5a8uWbz05W+3bnPmF2pqkcB1yAIm9TefHnLp0MUL5185/GJ/MDRv0bKqqhOewmLC3F50z0hojWBMmeCZpbDPDvvaf6xt93fcffddlw37lUrUtWs/CgZDCGkWQQHiWGTOULw0UcLMa1H2i+2tMhmTqIkiADDGiiDygPKr3nv/6LHj9947ofTcXnOee3b1ex+8ufIdyPF2p4N5Mo3pHMfJ4bAiSQ88MPmpxx/t3qNo196fZjw2c+vW791er6qqOu85jlMUNRzqAHLkDkAI2mxOhwNCprgQAI83f9OmrxpPn7766qu7duv+m99cXVm5mxJMKUuH2v3+YCCgR7ucVBroKTRlOKnMdcSVUJSyUADcHs933++oqa27/77fj7jiiqlT7h8y5KK58xbVnah35XkJphzP+dtaiotLXlyycPztN1MI/rb6w6dnzm5oaHHneTFWNfmzrfytrZ6C/MsuGVZWNqhbcQmgpL7h1A87Kyt/3EswdXm8BLMft8ezd+++xsamkaNGlXTrdu3116mqKoUlURR379q178d9NruNkIyaPbyx9aL7DuYwMdQ205yKthaNBAxVJW63p6nF9+KcReNur5o0ccJVvx4x8IIL/jh7ztZvtogeb+h0y2Xlly9eMPeXgwfVn6p/6eXlr7/+Ni/Y3HkejGXdPCmhcjh4330Tp029b8CAvkKcWoZC4X99+92cBUu2bv3O5cnXHajT6WxqPr1x44aSriUE47y8goFlA4PBoNZoTu4TmWYHFrm0NgliTFTMqI3d15xIJPvBKhZ4wWZ3rX73/RlPPL1z955ev+i5/NXFDz40xcmDKdMmf7B65aVDLtr+/fcTJk7+v+VvOVxuQRRUrGhLMT+hyqHXli5649WFZRf05xFDubqmpq7uBABUFMG1V438ct2H48aOCXS0IcTUEGMs8KIUkqqOVR09fLTx1Cm304Mxies0G7re5hUjMnzWFJrZMVbVcFhm8V/3JxDIajgUljiO03DWXAslrvy83Xv2PTj14dVrPnK73E8+Nm39p/94duYToo3781/fGn/npJ279uV3KdT8kBa9KOQQF2prGzdu7OT/uScYDMqKXF1XP3b8pF+NvGnolRV/mDLD1yYFAkEeoWUvze9T2issSToKLD+BUBQFURR5nieAaMmKhnACpKiuYCLB0VSNAooJlVWFUII0uWJZPadnz/79+/p9PgQRgEg/5MKq4nK7Q2E8c+azDz/6ZGurb0D/vuGwvG7dxv99cFpAUr15ebIqxyoOCnWdoRUVNzCPSKkoiI8++fRHaz4MSGpQVt9c8cZrb7zlcjlbfW2FBV1GlJerUojFpyhizJESzdYI1l07WzFCtuG4DSZTnEiwhpNmqSzqs+ikLYMQF5akRx6atu7DNbfcclOgvQ2rmEOcbiKYqByP3Pn5H3/8ye3jJ2zbvtPpdFxZftmsF2ZziPoDfo7nmReI7x9RFA6GFQyaW30NzT4OCcBml6SAv8MH7M6iomKfX2ptb/e1t7c0+wAzb2OJputXZzMwwsdUALV5+mFaQrbFhMAyHuavIoGKEk4Ufz51AgB5zuxnLh580dJXVrT62l0eL8ZKxASw6unS5XjNifH3THzq8emTfn/X9IemXHDB+U/NeqH6WLXTm6+ptB7kAOS5v6/5R+/S0uqq42FFvWLEKF501p886fG4b76p4qpR5bW11UVFJbt279367212l4uwZE7P3ZgS64iyHK3TPaXvidG4xKOz6NHKf0QoUVVFkRXd12NCbHb7goWLDx048MRjj9w1/rcD+vWbt2Dx7t0/OvIKEAAsFQZQVVS7w0mwOmvWc9u373xm5mMV11/T57zzZj03d+OGL0Wvl+dYAkwocXjcm7dsEW3i8PJhFEGe42+quLFP6S8K8rw8B1U5XFRUcvDIsRlPzGwPBO1Op5a9xsTEvCfTbcyojKolS7w7BWkNyNgr0E2TpVYMM72fxRYj1OnyfvLJZ1OmTd/7008XDx70ypL5E353tyJJsqwgTtB9O8EqhNCdX/jZ+s/HjZ+w9pPPepeeu+K1JU8+NZ2nOCxJPM+yd0qpYLNt+GLTqvf+Xlv7s9PudLGkRQ0E/C2+tqPVdUtffWP8XRP3HzjqcLoJIVrpHCmhEeIUReE45luYOFgRkkkbCOrcgfbC3oayTpblc3r1eGXZS0RWnpn93P6DR+w2O/MVAPA8CgYC+fmuJx+dXnHDtYqifPnl5mXL3/j5ZKPL6yEso4joFcdxUkgCgEyd8sAD90/0OO2bN//rhbnzjxyrcnvz9JoBIhSWwojjuncrOad7Dy9LM3Bjc1N1TbWvpdXmdAuCIEkhrWaMCReoqlpUXDxq1EiKOFEQt3+7raaqWhBFLSmMk5wp0SCSacWZsW4oGj+iDYeIf9Xvi6K9pb5RlkP9+vaub6i/8cZfXzBowMIlr239ZqvDW4AQ0JNkjLHNbqeULlvy8p49ex5/7JHh5cNWLF+6ZOnyzzdustkdHMcTjEWbDQB48mRDbe0JXScRz9tE0ZNfgDGWpFD37iWizcHWZNaGiIrdXs+QoZdQSkNScMcPu+pq6gTBFlelZl8tQea1tAqcrRBJ4ikECHJ+X1vXbiUr//LuHbdW+IPhosJil9NttzuXLHhhxZ9XvvO31QRAu92h+Rjm6CFA7i4F33yz9eDhw1OnTB418ooZ06f1Pu/cd1b9PRAKspGaWESRt9nEzn4HpZhgWZZGXDli5MgRkiTpdxQVUwDaOwKEkjZf67b//3fT6SabTafWIMhMCaZ6jcbiMCWc3rbQciwOcqFg4Jprrlq6eF7/vuc1NLWwsKQxxe12EwIefuiBi8oGLl76am11jdObr/l65uWxqri9eS0tbbOfn3vLmDGjR1836tcjC0uK31u95ujRKrvdwdJMBjgxfACBF/z+4IYNG2VFxqwjQM4/f6Db44EcrKur/e7f2+SwbLfb4wrjNE4LmkpY57Ce2VDKihUAIc+h9ta2cXfc/taflzU3NR2vqkFID3yQAsJacixUkhFXDP9Fr16v/+XNL77aLIh2nhMpIcyjUmpjqmtbu/bjA4cOjx5zY6+ePSbcc8+XmzZV7v6RZR9xm0eZTCHidu3aCSFQFNnp9Q699FKn0ylwqHJ3ZWXlbkHgRUHQqM30kIDG2XAih7RCHqtYxYpOFaGAF/nqmurvd+wqLirq6GgHWnNGTyY0HaQIMMK8BZ6pUx7o26/fu++t8bV1OJyusCRhVdWYAj153kOHjpxY8cZ111wzePAvx4wZ097RsX//IaaWuqAgVBQl2m2iiEMqVs/r3WfEyFF5+R5fq2/Tpk21dbUOuzOaeFjRZSVzGiM4oU9BAQ2Hw0AriCn7g0W74/sdlTePvfPJxx8tGzQwFArGl6DMoelxCbGqo3x4eVFRyeo17x86eLC0b9+hlwwFEBw9cnTfvp84HqkyXrv248NHjtpstqOHj4uiSAmFCBJCFEXp2rWbZixE6zSR3qV9LrywTBDF6prqzV9/HfAHnczyWU6UTpwgmVpDA0C/F1lKURRWwumlIQvDxON2t7U0bfr6m6Ku3Vqam3ieixl9tM8SSfAQQkXFxX/4w6Sjhw/37t27a7dinkeyNHLHzt2frF9ff6rR6XTv3bufUmy32YBWxyuKyiE06oqRpf37FOTn20Q7VhW2PAJBKVi5c9e2bdsg5Ow2m9YhthaqJbURiCM4In89laayonDRpXSSMMFQ6+g1NDSeajjFUohoctPZhYtqOKTQ7nScP2hgWAqvW7/h1M/1FTfcUD7s8h49e2zcuOm77T8IPC8IdhZvIApLksfjvvH6ii5FXWwOsabmeH39KYKplmBRX1vb4UOHBVGEEJqrsaWfosnPzA7EIcSUBIMhnvVfZKyEFZbTUKZpWA7LcsPpllMNTYIgaN412onT/4OAZT8stcbdiksOtR/7fN362tpaAOj+A4fH3nbr5cMuGffb2/r06bP+s89amloAhwDFJSXdRldU5BfkY6Ju2bJlx/YfWMHAdDra89G8cUT5sjt/pobReqYV91lzG127lkyf/gig9HhVla/VRylQVAVrJRTH22SFga7+zHUxpusy1qM387OtLS2hQKC6qkoOK3a7yBI4Bcvh8LDhl91w/fWFXQpPnDxx4OAhrBJRFHr26Gl3OBoaG77+6qsTdSecLremZzGU2TbpjmwzPVCH8Y14bR5zjHl53vF33IGJKquqLMnhsCzLsoJVBatSSFIUVaNU116tsazTqv1gjJubm5oaTyuyKoqCFmYZSxgjEAr5O4pLSq679rri4iKWlBGiYlUh5OefT36z+Z9hWbbb7Ky7FBFOgqRSUgtyJFgDLbOCkNM0Wes16wyk7Dwkmhjo1h5rCkcKXs3MmCJwHNQqOL3qj2GDNDMhLPF0MFPXT9YQkqQQx/Ech/QGbfJ7LjRDapOPImjCwOjZkqlVmKlR3JldrKLsXFkrVlkGbjwr6xweOT+MdHyiEyN95qQuXBayy2QcjD89NGvcJ90zYUx8TyV2AGk9KPIwQndMVeKojds2vksSaZ0aKcxAB6zDUnrvZ+gM5gwxOzBZyvSAzJza7LFAZmicCeTwMoZp0h+fX58NvHTQ3pf+70DWaCbrTiZ95qyBz3pG6hPZONWLnu1lL/VO40oXjLJnAp8qD01+ccVoa3Ffv0hcISNMUgzK5K2NrKiFkfF8qjy08yr2Lqhhkyi74kNTMp4WTDEu8l8CmHDNZ6AecYfU5pQnkm0FxtdQ418AzUSgGUPKd6P49ONMl0tofFu+42FcN4EjFrlOFqgkYwWyfG0pBml3NNeIJM2O3IQ5ep5UrQuznXP30jRpAxNs4l7+iRaWuTLPNCxFTgUs0UuxmDUgiwWirehMwKT2iNGfs03GO46klUyPR9OyhrJ/6eJwhh40ZsWdG2RLqtl4YykRd21qCmblAEgcFv9ly2S+WTxJgXCWqbw1JO5Ks7Rw61nIYlQiZ7L99pvhi+gpIO2XkA32EU9kvPwz2cWipxWLtPBMNTzFlGSZmDiCFE+TPLYpVtDkXpIN5yDG5AzUamTqYWn5ZVgnW6uByf/jEvOEJ6kKjalTsp5nrvw0LbXRPUzr3rRcttgUmexn8v2xMy7NMvGoxkd6ZEqUhClDU7CYGq8TX0yzTNCsscuu6ZQxGLLs1LsYnppGChr5G1c85Axnndpsk7TUHpEmPIt+jSerbZJXzwFiypl5wMss0po9orEr7RWorAwsc5wyT1cyfJS7KnUG+v8AmcgFLWfwTJ4AAAAASUVORK5CYII=" alt="NB"/></div>
      <div class="msg-content">
        <div class="bubble">Welcome to My Place Guesthouse! 🌺
I'm your NiteBot concierge, available 24/7. Ask me anything about check-in, WiFi, directions, nearby restaurants, or activities.
Feel free to ask in English, 日本語, 한국어, or 中文!</div>
        <div class="msg-time">Just now</div>
      </div>
    </div>
  </div>

  <!-- Quick replies -->
  <div class="quick-replies">
    <button class="quick-reply" onclick="sendQuick('What time is check-in?')">Check-in time?</button>
    <button class="quick-reply" onclick="sendQuick('What is the WiFi password?')">WiFi password?</button>
    <button class="quick-reply" onclick="sendQuick('Any restaurants nearby?')">Nearby food?</button>
    <button class="quick-reply" onclick="sendQuick('How do I get from the airport?')">From airport?</button>
    <button class="quick-reply" onclick="sendQuick('What are the house rules?')">House rules?</button>
  </div>

  <!-- Input -->
  <div class="input-area">
    <input type="text" id="input" placeholder="Ask about check-in, WiFi, local tips..." onkeydown="if(event.key==='Enter')sendMessage()" />
    <button class="send-btn" onclick="sendMessage()">
      <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
    </button>
  </div>

  <!-- Footer -->
  <div class="powered-by">Powered by <strong>NiteBot</strong> · AI Hotel Concierge Platform</div>

</div>

<script>
  const messages = [];
  const ICON_SRC = 'data:image/png;base64,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';

  const langGreetings = {
    en: 'Hello! Can you help me?',
    ja: 'こんにちは！教えていただけますか？',
    ko: '안녕하세요! 도와주실 수 있나요?',
    zh: '你好！请问可以帮我吗？'
  };

  function switchLang(lang) {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    sendQuick(langGreetings[lang]);
  }

  async function sendMessage() {
    const input = document.getElementById('input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage(text, 'user');
    messages.push({ role: 'user', content: text });
    showTyping();
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      removeTyping();
      const reply = data.reply || 'Sorry, something went wrong. Please try again.';
      addMessage(reply, 'bot');
      messages.push({ role: 'assistant', content: reply });
    } catch (e) {
      removeTyping();
      addMessage('Sorry, I am having trouble connecting. Please try again shortly.', 'bot');
    }
  }

  function sendQuick(text) {
    document.getElementById('input').value = text;
    sendMessage();
  }

  function getTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(text, role) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'message ' + role;
    const avatarHTML = role === 'bot'
      ? '<img src="' + ICON_SRC + '" alt="NB" style="width:24px;height:24px;object-fit:contain;"/>'
      : 'You';
    div.innerHTML =
      '<div class="msg-avatar">' + avatarHTML + '</div>' +
      '<div class="msg-content">' +
        '<div class="bubble">' + text.replace(/</g, '&lt;').replace(/\\n/g, '<br>') + '</div>' +
        '<div class="msg-time">' + getTime() + '</div>' +
      '</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'message bot typing';
    div.id = 'typing';
    div.innerHTML =
      '<div class="msg-avatar"><img src="' + ICON_SRC + '" alt="NB" style="width:24px;height:24px;object-fit:contain;"/></div>' +
      '<div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('typing');
    if (t) t.remove();
  }
</script>
</body>
</html>`;;

function callOpenAI(messages, callback) {
  const body = JSON.stringify({
    model: "gpt-4o-mini",
    max_tokens: 500,
    messages: [
      { role: "system", content: HOTEL_KNOWLEDGE },
      ...messages
    ]
  });
  const options = {
    hostname: "api.openai.com",
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENAI_API_KEY,
      "Content-Length": Buffer.byteLength(body)
    }
  };
  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        const reply = parsed.choices[0].message.content;
        callback(null, reply);
      } catch (e) {
        callback("Parse error");
      }
    });
  });
  req.on("error", (e) => callback(e.message));
  req.write(body);
  req.end();
}

const DEMO_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Place Guesthouse — Tomari, Okinawa</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --sand: #f5f0e8;
    --ocean: #1a6b8a;
    --ocean-dark: #0f4a62;
    --coral: #e8694a;
    --text: #2c2c2c;
    --muted: #6b6b6b;
  }
  body { font-family: 'Inter', sans-serif; background: var(--sand); color: var(--text); }

  /* NAV */
  nav {
    background: white;
    padding: 16px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    position: sticky; top: 0; z-index: 100;
  }
  .nav-logo { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--ocean-dark); }
  .nav-logo span { color: var(--coral); }
  .nav-links { display: flex; gap: 28px; list-style: none; }
  .nav-links a { text-decoration: none; color: var(--muted); font-size: 14px; font-weight: 500; transition: color 0.2s; }
  .nav-links a:hover { color: var(--ocean); }
  .nav-cta {
    background: var(--ocean);
    color: white;
    padding: 9px 20px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
  }
  .nav-cta:hover { background: var(--ocean-dark); }

  /* HERO */
  .hero {
    height: 520px;
    background:
      linear-gradient(to bottom, rgba(15,74,98,0.55) 0%, rgba(15,74,98,0.3) 60%, rgba(245,240,232,0.1) 100%),
      radial-gradient(ellipse at 70% 40%, #1a8fa8 0%, #0f6b8a 30%, #063a52 70%, #021e2e 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      radial-gradient(2px 2px at 15% 25%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(2px 2px at 35% 15%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 60% 30%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(2px 2px at 80% 20%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(3px 3px at 50% 60%, rgba(255,255,255,0.15) 0%, transparent 100%),
      radial-gradient(2px 2px at 25% 70%, rgba(255,255,255,0.2) 0%, transparent 100%),
      radial-gradient(60px 20px at 30% 75%, rgba(255,255,255,0.06) 0%, transparent 100%),
      radial-gradient(80px 25px at 65% 80%, rgba(255,255,255,0.05) 0%, transparent 100%);
    pointer-events: none;
  }
  .hero-badge {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    font-size: 12px;
    letter-spacing: 0.12em;
    padding: 5px 14px;
    border-radius: 20px;
    margin-bottom: 16px;
    backdrop-filter: blur(4px);
  }
  .hero h1 {
    font-family: 'Playfair Display', serif;
    font-size: 48px;
    font-weight: 700;
    color: white;
    margin-bottom: 12px;
    text-shadow: 0 2px 20px rgba(0,0,0,0.3);
  }
  .hero p {
    font-size: 17px;
    color: rgba(255,255,255,0.85);
    margin-bottom: 28px;
    max-width: 480px;
    line-height: 1.6;
  }
  .hero-btns { display: flex; gap: 12px; }
  .btn-primary {
    background: var(--coral);
    color: white;
    padding: 13px 28px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(232,105,74,0.4);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(232,105,74,0.5); }
  .btn-secondary {
    background: rgba(255,255,255,0.15);
    color: white;
    padding: 13px 28px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: 15px;
    border: 1px solid rgba(255,255,255,0.4);
    backdrop-filter: blur(4px);
    transition: all 0.2s;
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.25); }

  /* FEATURES BAR */
  .features-bar {
    background: var(--ocean-dark);
    display: flex;
    justify-content: center;
    gap: 48px;
    padding: 18px 40px;
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255,255,255,0.85);
    font-size: 13px;
    font-weight: 500;
  }
  .feature-icon { font-size: 16px; }

  /* SECTIONS */
  .section { padding: 64px 40px; max-width: 1100px; margin: 0 auto; }
  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--ocean-dark);
    margin-bottom: 8px;
  }
  .section-sub { color: var(--muted); font-size: 15px; margin-bottom: 36px; }

  /* ROOMS GRID */
  .rooms-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .room-card {
    background: white;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .room-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
  .room-img {
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
  }
  .room-img.dorm { background: linear-gradient(135deg, #1a6b8a, #0f4a62); }
  .room-img.private { background: linear-gradient(135deg, #2d8a6b, #1a5a45); }
  .room-img.deluxe { background: linear-gradient(135deg, #8a4a1a, #5a2d0a); }
  .room-body { padding: 16px; }
  .room-name { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
  .room-desc { font-size: 13px; color: var(--muted); margin-bottom: 12px; line-height: 1.5; }
  .room-price { font-size: 14px; font-weight: 600; color: var(--coral); }

  /* AMENITIES */
  .amenities-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .amenity {
    background: white;
    border-radius: 12px;
    padding: 20px 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .amenity-icon { font-size: 28px; margin-bottom: 8px; }
  .amenity-name { font-size: 13px; font-weight: 500; color: var(--text); }

  /* LOCATION */
  .location-section { background: white; padding: 64px 40px; }
  .location-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
  .map-placeholder {
    height: 280px;
    background: linear-gradient(135deg, #d4e8f0, #a8d4e8);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
  .location-info h3 { font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 16px; color: var(--ocean-dark); }
  .location-list { list-style: none; }
  .location-list li { padding: 8px 0; font-size: 14px; color: var(--muted); border-bottom: 1px solid #f0f0f0; display: flex; gap: 10px; }
  .location-list li:last-child { border-bottom: none; }

  /* FOOTER */
  footer {
    background: var(--ocean-dark);
    color: rgba(255,255,255,0.7);
    text-align: center;
    padding: 32px 40px;
    font-size: 13px;
    line-height: 1.8;
  }
  footer strong { color: white; }

  /* NITEBOT WIDGET */
  .chat-fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 1000;
  }
  .chat-bubble-btn {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0099cc, #00d4ff);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0,212,255,0.45);
    transition: all 0.3s;
  }
  .chat-bubble-btn svg { width: 32px; height: 32px; }
  .chat-bubble-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,212,255,0.6); }
  .chat-pulse {
    position: absolute;
    top: -3px; right: -3px;
    width: 14px; height: 14px;
    background: #4ade80;
    border-radius: 50%;
    border: 2px solid white;
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.1)} }
  .chat-tooltip {
    position: absolute;
    bottom: 70px;
    right: 0;
    background: #0a1628;
    color: white;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 13px;
    white-space: nowrap;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    border: 1px solid rgba(0,212,255,0.2);
    animation: fadeIn 0.3s ease;
  }
  .chat-tooltip::after {
    content: '';
    position: absolute;
    bottom: -6px; right: 22px;
    width: 12px; height: 12px;
    background: #0a1628;
    border-right: 1px solid rgba(0,212,255,0.2);
    border-bottom: 1px solid rgba(0,212,255,0.2);
    transform: rotate(45deg);
  }
  .chat-panel {
    position: fixed;
    bottom: 80px;
    right: 28px;
    width: 380px;
    height: min(640px, calc(100vh - 100px));
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3), 0 0 60px rgba(0,212,255,0.12);
    display: none;
    z-index: 999;
    animation: slideUp 0.3s ease;
    border: 1px solid rgba(0,212,255,0.2);
  }
  .chat-panel iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-logo">My Place <span>Guesthouse</span></div>
  <ul class="nav-links">
    <li><a href="#">Rooms</a></li>
    <li><a href="#">Activities</a></li>
    <li><a href="#">Location</a></li>
    <li><a href="#">Gallery</a></li>
  </ul>
  <a href="#" class="nav-cta">Book Now</a>
</nav>

<!-- HERO -->
<div class="hero">
  <div class="hero-badge">⭐ 4.8 · Tomari, Naha, Okinawa</div>
  <h1>Your Home in Okinawa</h1>
  <p>Steps from Tomari Port and the Kerama Islands ferry. The perfect base for exploring Okinawa.</p>
  <div class="hero-btns">
    <a href="#" class="btn-primary">Check Availability</a>
    <a href="#" class="btn-secondary">Take a Tour</a>
  </div>
</div>

<!-- FEATURES BAR -->
<div class="features-bar">
  <div class="feature-item"><span class="feature-icon">🛥️</span> 1 min from Kerama Ferry</div>
  <div class="feature-item"><span class="feature-icon">🌐</span> 4 languages spoken</div>
  <div class="feature-item"><span class="feature-icon">🅿️</span> Free private parking</div>
  <div class="feature-item"><span class="feature-icon">🍳</span> Shared kitchen 24h</div>
  <div class="feature-item"><span class="feature-icon">🤿</span> Dive & tour desk</div>
</div>

<!-- ROOMS -->
<div class="section">
  <div class="section-title">Rooms & Dormitories</div>
  <div class="section-sub">Whether you're a solo traveler or a group — we have you covered.</div>
  <div class="rooms-grid">
    <div class="room-card">
      <div class="room-img dorm">🛏️</div>
      <div class="room-body">
        <div class="room-name">Dormitory Bunk</div>
        <div class="room-desc">Bunk beds with privacy curtains, reading light, and personal power socket. Harbor view available.</div>
        <div class="room-price">From ¥3,500 / night</div>
      </div>
    </div>
    <div class="room-card">
      <div class="room-img private">🏠</div>
      <div class="room-body">
        <div class="room-name">Private Room</div>
        <div class="room-desc">Your own space with en-suite or shared bathroom. Ideal for couples and families.</div>
        <div class="room-price">From ¥8,500 / night</div>
      </div>
    </div>
    <div class="room-card">
      <div class="room-img deluxe">✨</div>
      <div class="room-body">
        <div class="room-name">Deluxe Twin</div>
        <div class="room-desc">Two semi-double beds, sofa, full hotel amenities, and stunning harbor view.</div>
        <div class="room-price">From ¥14,000 / night</div>
      </div>
    </div>
  </div>
</div>

<!-- AMENITIES -->
<div style="background: white; padding: 64px 0;">
  <div class="section" style="padding-top: 0; padding-bottom: 0;">
    <div class="section-title">Amenities</div>
    <div class="section-sub">Everything you need for the perfect Okinawa stay.</div>
    <div class="amenities-grid">
      <div class="amenity"><div class="amenity-icon">📶</div><div class="amenity-name">Free WiFi</div></div>
      <div class="amenity"><div class="amenity-icon">🏍️</div><div class="amenity-name">Bike Rental</div></div>
      <div class="amenity"><div class="amenity-icon">☕</div><div class="amenity-name">Cafe & Bar</div></div>
      <div class="amenity"><div class="amenity-icon">💻</div><div class="amenity-name">Coworking Space</div></div>
      <div class="amenity"><div class="amenity-icon">🧺</div><div class="amenity-name">Laundry</div></div>
      <div class="amenity"><div class="amenity-icon">🛁</div><div class="amenity-name">Shared Lounge</div></div>
      <div class="amenity"><div class="amenity-icon">🤿</div><div class="amenity-name">Snorkel Rental</div></div>
      <div class="amenity"><div class="amenity-icon">🧳</div><div class="amenity-name">Luggage Storage</div></div>
    </div>
  </div>
</div>

<!-- LOCATION -->
<div class="location-section">
  <div class="location-inner">
    <div class="map-placeholder">🗺️</div>
    <div class="location-info">
      <h3>Prime Location in Tomari</h3>
      <ul class="location-list">
        <li><span>🛥️</span> 1 min walk from Tomari Port (Kerama Islands ferry)</li>
        <li><span>🚝</span> 15 min walk from Miebashi Station (Yui Rail)</li>
        <li><span>✈️</span> 20 min by car from Naha Airport</li>
        <li><span>🐟</span> 5 min walk to Tomari Fish Market</li>
        <li><span>🏖️</span> Short walk to Naminoue Beach</li>
        <li><span>🛍️</span> 20 min walk to Kokusai Dori</li>
      </ul>
    </div>
  </div>
</div>

<!-- FOOTER -->
<footer>
  <strong>My Place Guesthouse</strong><br>
  Seasir Tomari Building, 3-1-8 Tomari, Naha, Okinawa 900-0012<br>
  📞 +81 80-8569-2887 · ✉️ myplace-okinawa@seasir.com · 🌐 myplace-guesthouse.com<br><br>
  <span style="font-size:11px;opacity:0.5;">AI Concierge powered by <strong style="color:rgba(0,212,255,0.7)">NiteBot</strong> · 24時間対応</span>
</footer>

<!-- NITEBOT FLOATING WIDGET -->
<div class="chat-fab" id="chatFab">
  <div class="chat-tooltip" id="tooltip">💬 Ask me anything!</div>
  <button class="chat-bubble-btn" onclick="toggleChat()" id="fabBtn">
    <svg id="fabIcon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Antenna -->
      <line x1="20" y1="5" x2="20" y2="9" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="20" cy="4" r="1.8" fill="white"/>
      <!-- Head / speech bubble body -->
      <rect x="7" y="9" width="26" height="18" rx="5" fill="white"/>
      <!-- Speech bubble tail -->
      <path d="M14 27 L12 33 L20 27 Z" fill="white"/>
      <!-- Left ear -->
      <rect x="4" y="14" width="3.5" height="7" rx="1.5" fill="white"/>
      <!-- Right ear -->
      <rect x="32.5" y="14" width="3.5" height="7" rx="1.5" fill="white"/>
      <!-- Left eye -->
      <circle cx="15" cy="18" r="2.5" fill="#0099cc"/>
      <circle cx="15" cy="18" r="1" fill="white"/>
      <!-- Right eye -->
      <circle cx="25" cy="18" r="2.5" fill="#0099cc"/>
      <circle cx="25" cy="18" r="1" fill="white"/>
      <!-- Smile -->
      <path d="M15.5 23 Q20 26.5 24.5 23" stroke="#0099cc" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    </svg>
  </button>
  <div class="chat-pulse"></div>
</div>
<div class="chat-panel" id="chatPanel">
  <iframe src="/" id="chatFrame"></iframe>
</div>

<script>
  let open = false;
  let tooltipHidden = false;

  setTimeout(() => {
    const t = document.getElementById('tooltip');
    if (!tooltipHidden) { t.style.opacity = '0'; t.style.transition = 'opacity 0.5s'; }
  }, 4000);

  const robotSVG = document.getElementById('fabBtn').innerHTML;
  const closeSVG = '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="12" x2="28" y2="28" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="28" y1="12" x2="12" y2="28" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>';

  function toggleChat() {
    open = !open;
    tooltipHidden = true;
    document.getElementById('tooltip').style.display = 'none';
    const panel = document.getElementById('chatPanel');
    const btn = document.getElementById('fabBtn');
    if (open) {
      panel.style.display = 'block';
      btn.innerHTML = closeSVG;
    } else {
      panel.style.display = 'none';
      btn.innerHTML = robotSVG;
    }
  }
</script>
</body>
</html>`;

// ── Static file helper ────────────────────────────────────────────────────
const MIME = {
  ".html": "text/html",
  ".css":  "text/css",
  ".js":   "application/javascript",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".ico":  "image/x-icon",
  ".svg":  "image/svg+xml",
};
function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(data);
  });
}
const PUBLIC = path.join(__dirname, "public");

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0]; // strip query strings

  // ── Website pages ───────────────────────────────────────────────────────
  if (req.method === "GET" && url === "/") {
    serveFile(res, path.join(PUBLIC, "index.html"));
    return;
  }
  if (req.method === "GET" && url === "/pricing") {
    serveFile(res, path.join(PUBLIC, "pricing.html"));
    return;
  }
  if (req.method === "GET" && url === "/demo") {
    serveFile(res, path.join(PUBLIC, "demo.html"));
    return;
  }
  if (req.method === "GET" && url === "/contact") {
    serveFile(res, path.join(PUBLIC, "contact.html"));
    return;
  }

  // ── Static assets (CSS, JS, images) ────────────────────────────────────
  if (req.method === "GET" && (url === "/style.css" || url === "/main.js" || url === "/logo.png" || url.startsWith("/NiteBot_"))) {
    serveFile(res, path.join(PUBLIC, url));
    return;
  }

  // ── Chatbot (kept at /bot for direct access) ────────────────────────────
  if (req.method === "GET" && url === "/bot") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML_PAGE);
    return;
  }

  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { messages } = JSON.parse(body);
        callOpenAI(messages, (err, reply) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ reply: "Sorry, I am having trouble. Please try again." }));
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ reply }));
          }
        });
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply: "Bad request" }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("NiteBot running on port " + PORT);
});
