window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

var running = false,
  name = "",
  email = "",
  dept = "",
  server_api = '127.0.0.1:8000',
  message_box = document.getElementById('message-box');
var response_list = [];
var intents_list = [];

function send() {
  if (running == true) return;
  if (msg == "") return;
  var msg = document.getElementById("message").value;
  running = true;
  addMsg(msg);
}

function startSr() {
  const recognition = new SpeechRecognition();
  var speech = true;
  var transcript;

  recognition.interimResults = false;

  recognition.addEventListener('result', e => {
    transcript = Array.from(e.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('')
    addMsg(transcript);
  });

  if (speech == true) {
    recognition.start();
  }
}

function addMsg(msg) {
  var div = document.createElement("div");
  div.innerHTML =
    "<span style='flex-grow:1'></span><div class='chat-message-sent'>" +
    msg +
    "</div>";
  div.className = "chat-message-div";
  document.getElementById("message-box").appendChild(div);

  //SEND MESSAGE TO API
  document.getElementById("message").value = "";
  document.getElementById("message-box").scrollTop = document.getElementById("message-box").scrollHeight;

  //LOADER START
  var loader = document.createElement("div");
  loader.innerHTML = '<div title="getting response..."><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="30px" viewBox="0 0 24 30" style="enable-background:new 0 0 50 50;" xml:space="preserve"><rect x="0" y="10" width="4" height="10" fill="grey" opacity="0.2"><animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0s" dur="0.6s" repeatCount="indefinite" /><animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0s" dur="0.6s" repeatCount="indefinite" /><animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0s" dur="0.6s" repeatCount="indefinite" /></rect><rect x="8" y="10" width="4" height="10" fill="grey"  opacity="0.2"><animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.15s" dur="0.6s" repeatCount="indefinite" /><animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" /><animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" /></rect><rect x="16" y="10" width="4" height="10" fill="grey"  opacity="0.2"><animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.3s" dur="0.6s" repeatCount="indefinite" /><animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" /><animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" /></rect></svg></div>';
  loader.className = "chat-message-received loader";
  document.getElementById("message-box").appendChild(loader);
  document.getElementById("message-box").scrollTop = document.getElementById("message-box").scrollHeight;
  //LOADER END

  prev_msg = document.getElementById('message-box').children[document.getElementById('message-box').children.length - 3].textContent;
  console.log(prev_msg);
  //console.log(document.getElementById('message-box').children[document.getElementById('message-box').children.length - 3]);

  if (msg.toLowerCase() == "yes") {
    if (prev_msg == "Yes / No") {
      transferLiveChat();
    }
    else if (prev_msg == "Are you satisfied with the Chatbot's Response? Answer with 'Yes' or 'No'.") {
      removeLoader();
      setTimeout(addResponseMsg, 500, "Thank You for your co-operations with us.")
      setTimeout(addResponseMsg, 1000, "Please feel free to ask any other questions.")
    }
  }

  else if (msg.toLowerCase() == "no") {
    if (prev_msg == "Yes / No") {
      ask_another()
    }
    else if (prev_msg == "Are you satisfied with the Chatbot's Response? Answer with 'Yes' or 'No'.") {
      removeLoader();
      var length_ = document.getElementById('message-box').children;
      // send wrong answer to db
      // console.log(length_);
      // console.log(length_[length_.length - 4].textContent);
      var ques = length_[length_.length - 4].textContent;
      var ans = response_list[0];
      var intent = intents_list[0];
      console.log(ques, ans);
      var data = { 'user_email': email, 'event_type': '', 'event_question': ques, 'event_answer': ans, 'intent': intent };
      fetch("http://" + server_api + "/wrong_answer/", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      }).then(res => {
        res.text().then(function (text) { })
      });
      setTimeout(addResponseMsg, 500, "Do you want to talk with our Human Agent? please <strong>Click</strong> on either Yes or No")
      setTimeout(addResponseMsg, 1000, "<p onclick='transferLiveChat()'>Yes</p> / <p onclick='ask_another()'>No</p>")
    }
  }

  else sendInputToWatson(msg);
}

function sendInputToWatson(input) {
  var data = data = { 'user_email': email, 'event_type': '4', 'event_question': input, 'session_value': '' },
    unknown = "I didn't quite get that.",
    sorry = "Sorry, I am not able to detect the language you are speaking. Please try rephrasing.",
    api = "http://127.0.0.1:8000/watson-assistant/";

  fetch(api, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => {
    res.text().then(function (text) {
      if (res.status == 200) {
        removeLoader();
        console.log(JSON.parse(text));
        console.log(dept);
        response_list.push(JSON.parse(text).answer);
        intents_list.push(JSON.parse(text).intent);

        if (JSON.parse(text).answer.toLowerCase() == sorry) {
          addResponseMsg(JSON.parse(text).answer);
          addResponseMsg("Do you want to talk with our Human Agent? please <strong>Click</strong> on either Yes or No");
          addResponseMsg("<p onclick='transferLiveChat()'>Yes</p> / <p onclick='ask_another()'>No</p>");
          //addResponseMsg("<a href='https://live-test-772cf.web.app/' target='_blank'>Yes</a> / <a href='#' onclick='ask_another()'>No</a>");
          //addResponseMsg("<a href='#' onclick='ask_another()'>No</a>");
        }

        else if (JSON.parse(text).intent == dept) {
          for (var i = 0; i < response_list.length; i++) {
            if (response_list[i] != JSON.parse(text).answer) {
              response_list = [];
              intents_list = [];
              response_list.push(JSON.parse(text).answer);
              intents_list.push(JSON.parse(text).intent);
              break
            }
  
            else if (response_list[i] == JSON.parse(text).answer && response_list.length == 3) {
              setTimeout(addResponseMsg, 500, "Are you satisfied with the Chatbot's Response? Answer with 'Yes' or 'No'.");
              break;
            }
          }          
        }

        else {
          addResponseMsg("Please ask questions according to the Department You selected.");
        }
      }

      else {
        removeLoader();
        addResponseMsg(unknown);
      }
    });
  });
}

function transferLiveChat() {
  //logout
  var data = { 'user_email': email, 'event_type': '2', 'event_question': '' };
  fetch("http://" + server_api + "/login/", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => {
    res.text().then(function (text) {
    })
  });

  var data = { 'user_email': email, 'event_type': '6', 'event_question': '' };
  fetch("http://" + server_api + "/login/", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => {
    res.text().then(function (text) {
    })
  });

  document.getElementById("chatbot").classList.add("collapsed")
  document.getElementById("chatbot_toggle").children[0].style.display = "inline-block"
  document.getElementById("chatbot_toggle").children[1].style.display = "none"
  document.getElementById("chatbot").children[1].style.display = "none"
  document.getElementById("chatbot").children[4].style.display = "none"
  document.getElementById("chatbot_toggle").style.backgroundColor = "white"

  window.__lc = window.__lc || {};
  window.__lc.license = 13510746;;

  (function (n, t, c) {
    function i(n) {
      return e._h ? e._h.apply(null, n) : e._q.push(n)
    }

    var e = {
      _q: [],
      _h: null,
      _v: "2.0",

      on: function () {
        i(["on", c.call(arguments)])
      },

      once: function () {
        i(["once", c.call(arguments)])
      },

      off: function () {
        i(["off", c.call(arguments)])
      },

      get: function () {
        if (!e._h) throw new Error("[LiveChatWidget] You can't use getters before load.");
        return i(["get", c.call(arguments)])
      },

      call: function () {
        i(["call", c.call(arguments)])
      },

      init: function () {
        var n = t.createElement("script");
        n.async = !0, n.type = "text/javascript", n.src = "https://cdn.livechatinc.com/tracking.js", t.head.appendChild(n)
      }

    };

    !n.__lc.asyncInit && e.init(), n.LiveChatWidget = n.LiveChatWidget || e

  }(window, document, [].slice))

  var divs = document.getElementById("message-box").children;
  var msgs = [];
  for (i = 0; i <= divs.length - 4; i++) {
    msgs.push(divs[i].innerText);
  }

  window.LiveChatWidget.call("set_customer_name", name);
  window.LiveChatWidget.call("set_customer_email", email);
  window.LiveChatWidget.call("maximize");
  window.LiveChatWidget.call("set_session_variables", {
    customer_chat: msgs
  });
}

function ask_another() {
  removeLoader();
  addResponseMsg("If you have any other questions, feel free to ask it.");
}

function removeLoader() {
  message_box.lastChild.remove();
}

function addResponseMsg(msg) {
  var div = document.createElement("div");
  div.innerHTML = "<div class='chat-message-received'>" + msg + "</div>";
  div.className = "chat-message-div";
  document.getElementById("message-box").appendChild(div);
  document.getElementById("message-box").scrollTop = document.getElementById(
    "message-box"
  ).scrollHeight;
  running = false;
}

document.getElementById("message").addEventListener("keyup", function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    send();
  }
});

document.getElementById("chatbot_toggle").onclick = function () {
  if (document.getElementById("chatbot").classList.contains("collapsed")) {
    document.getElementById("chatbot").classList.remove("collapsed")
    document.getElementById("chatbot_toggle").children[0].style.display = "none"
    document.getElementById("chatbot_toggle").children[1].style.display = ""
    document.getElementById("chatbot").children[1].style.display = ""

    if (document.getElementById("cred-form").classList.contains("inactive")) {
      document.getElementById("chatbot").children[3].style.display = ""
      document.getElementById("chatbot").children[4].style.display = ""
      document.getElementById("chatbot").children[5].style.display = ""
    } else {
      document.getElementById('refreshbtn').style.display = "none"
      document.getElementById("chatbot").children[3].style.display = "none"
      document.getElementById("chatbot").children[4].style.display = "none"
      document.getElementById("chatbot").children[5].style.display = "none"
    }

    document.getElementById("cred-form").style.display = ""
    document.getElementById("chatbot_toggle").style.backgroundColor = "transparent"
    document.getElementById("user-name").focus();
    //if (checkWelcomeMsg()) setTimeout(addResponseMsg,1000,"Hi, This is Zayed University AI Chatbot.")
  }

  else {
    var msgs = document.getElementById("message-box");
    while (msgs.lastChild) msgs.removeChild(msgs.lastChild);
    document.getElementById("cred-form").classList.remove("inactive")
    document.getElementById("cred-form").classList.add("active")
    document.getElementById("chatbot").classList.add("collapsed")
    document.getElementById("chatbot_toggle").children[0].style.display = "inline-block"
    document.getElementById("chatbot_toggle").children[1].style.display = "none"
    document.getElementById("chatbot").children[1].style.display = "none"
    document.getElementById("cred-form").style.display = "none"
    document.getElementById("chatbot").children[4].style.display = "none"
    document.getElementById("chatbot_toggle").style.backgroundColor = "white"
  }
}

function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

function clear_chatbot() {
  var msgs = document.getElementById("message-box");
  db_commit = false;

  while (msgs.lastChild) {
    if (msgs.lastChild.textContent.includes("This is Zayed University AI Chatbot.")) break;
    else {
      db_commit = true;
      msgs.removeChild(msgs.lastChild);
    }
  }

  if (db_commit) {
    var data = { 'user_email': email, 'event_type': '7', 'event_question': '' };
    fetch("http://" + server_api + "/login/", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      res.text().then(function (text) {
      })
    });
  }
}

function validateEmail2(mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return (true)
  }
  return (false)
}

function checkForm() {
  user_name = document.getElementById("user-name").value;
  email = document.getElementById("user-email").value;
  dept = document.getElementById("department").value;

  if (validateEmail2(email)) {
    if (user_name != '' && dept != "") {
      if (document.getElementById("cred-form").classList.contains("active")) {
        var data = { 'user_email': email, 'event_type': '1', 'event_question': '', 'intent': dept};
        console.log(data);
        fetch("http://" + server_api + "/login/", {
          method: "POST",
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
        }).then(res => {
          res.text().then(function (text) {
          })
        });

        document.getElementById("cred-form").classList.remove("active")
        document.getElementById("cred-form").classList.add("inactive")
        document.getElementById("chatbot").children[3].style.display = ""
        document.getElementById('refreshbtn').style.display = ""
        document.getElementById("chatbot").children[4].style.display = ""
        document.getElementById("chatbot").children[5].style.display = ""

        if (checkWelcomeMsg()) setTimeout(addResponseMsg, 500, "Hi " + user_name + ", This is Zayed University AI Chatbot.")
        document.getElementById("message").focus();
      }
    }
  }
}

function checkWelcomeMsg() {
  var list = document.getElementById("message-box").querySelectorAll('div');
  if (list.length == 0) return true;
  return false;
}

document.getElementById("chatbot_toggle").children[1].style.display = "none"
document.getElementById("chatbot").children[1].style.display = "none"
document.getElementById("chatbot").children[4].style.display = "none"
