

const askExampleButtonElements = document.getElementsByClassName("ask-example-button");
const askButtonElement = document.getElementById("ask-button");
const inputElement = document.getElementById("search-box-input");
const chatFeedListElement = document.getElementById("chat-feed-list");

const stringTerminators = new Set(['?', '.', '!']);
let nbqTimeoutId = null;
let waitBeforeNbq = 15000;


const addCharsWithSleep = (str, divElement, showFollow, id) => {
    let i = 0;
    let intervalId = setInterval(() => {
    if (i >= str.length) {
      clearInterval(intervalId);
      return;
    }
    if (str[i] === '\n' && divElement.innerHTML.length > 1) {
        divElement.innerHTML = divElement.innerHTML + '<br/>';
    } else {
        divElement.innerHTML = divElement.innerHTML + str[i];
        if (i%20 === 0 || i === str.length - 1) {
            const chatFeed = document.getElementById('chat-feed');
            chatFeed.scrollTop = chatFeed.scrollHeight;
        }
    }
    i++;
  }, 20);
}


const createResponseElement = (responseText, animate, loadingElement,id) => {
    if (loadingElement) {
        const cardBodyDivElement = loadingElement.lastChild.firstChild;
        cardBodyDivElement.firstChild.remove();
        if (animate) {
            addCharsWithSleep(responseText, cardBodyDivElement, id);
        } else {
            cardBodyDivElement.innerHTML = responseText.trim().replaceAll('\n', "<br/>");
            cardBodyDivElement.innerHTML = cardBodyDivElement.innerHTML + '<br/><br/>';
            const chatFeed = document.getElementById('chat-feed');
            chatFeed.scrollTop = chatFeed.scrollHeight;
        }
        return loadingElement;
    }
    const newDiv = document.createElement("li");
    newDiv.className = "kural-card d-flex align-self-start";

    const imageElement = document.createElement("img");
    imageElement.className="align-baseline"
    imageElement.src = "static/thirvalluvar.jpg";
    newDiv.appendChild(imageElement);

    const cardDiv = document.createElement("div");
    cardDiv.className = "card mb-3";

    const cardBodyDiv = document.createElement("div");
    if (animate) {
        addCharsWithSleep(responseText, cardBodyDiv);
    } else {
        cardBodyDiv.innerHTML = responseText.trim().replaceAll('\n', "<br/>");
    }
    cardBodyDiv.className = "card-body translate-text";

    cardDiv.appendChild(cardBodyDiv);
    newDiv.appendChild(cardDiv);
    return newDiv;
}

const createLoadingResponse = () => {
    const newDiv = document.createElement("li");
    newDiv.className = "kural-card d-flex align-self-start";

    const imageElement = document.createElement("img");
    imageElement.className="align-baseline"
    imageElement.src = "static/thiruvalluvar.jpg";
    newDiv.appendChild(imageElement);

    const cardDiv = document.createElement("div");
    cardDiv.className = "card mb-3";

    const cardBodyDiv = document.createElement("div");
    cardBodyDiv.className = "card-body translate-text";

    const typingDot1 = document.createElement("span");
    const typingDot2 = document.createElement("span");
    const typingDot3 = document.createElement("span");
    const typingDots = document.createElement("div");
    typingDots.appendChild(typingDot1);
    typingDots.appendChild(typingDot2);
    typingDots.appendChild(typingDot3);
    typingDots.className = "typing"
    cardBodyDiv.appendChild(typingDots);

    cardDiv.appendChild(cardBodyDiv);
    newDiv.appendChild(cardDiv);

    return newDiv;
}

const disableAskButton = () => {
    askButtonElement.disabled = true;
    askButtonElement.setAttribute("disabled", "disabled");
    inputElement.disabled = true;
    inputElement.setAttribute("disabled", "disabled");
}

const enableAskButton = () => {
    askButtonElement.disabled = false;
    askButtonElement.removeAttribute('disabled');
    inputElement.disabled = false;
    inputElement.removeAttribute('disabled');
    inputElement.focus();
}

const appendUserResponses = (question, answer, id) => {
    let userResponses = JSON.parse(localStorage.getItem("user-responses"));
    if (!Array.isArray(userResponses)) {
        userResponses = [];
    }
    userResponses.push({
        "question": question,
        "answer": answer,
        "id": id
    });
    localStorage.setItem("user-responses", JSON.stringify(userResponses));
}

const clearNbq = () => {
    let nbqElement = document.getElementById("nbq");
    if (nbqElement && !nbqElement.classList.contains("d-none")) {
        nbqElement.classList.add("d-none");
    }
    if (nbqTimeoutId) {
        clearTimeout(nbqTimeoutId);
        nbqTimeoutId = null;
    }
}

function logError(error) {
    fetch('/api/log/error?message=' + error )
        .then(response => response.json())
        .then(data => {
            //
        })
        .catch(error => {
            // handle any errors
            console.error(error);
        });
}

const retryFromGita = async (id, query) => {
    if (!id) return;
    clearNbq();
    showChat();
    disableAskButton();
    inputElement.value = "";
    const loadingElement = chatFeedListElement.appendChild(createLoadingResponse());
    const chatFeed = document.getElementById('chat-feed');
    const userEmail = localStorage.getItem("user-email");
    let locale = localStorage.getItem("locale")
    if (!locale) locale = 'en';
    chatFeed.scrollTop = chatFeed.scrollHeight;
    fetch('/api/ask/retry?id=' + id + '&email=' + userEmail + '&locale=' + locale)
        .then(response => response.json())
        .then(async data => {
            if (data.response) {
                let translatedAnswer = data.response;
                if (locale !== 'en') {
                    translatedAnswer = await translateToLang(data.response, 'auto', locale);
                }
                createResponseElement(translatedAnswer, true, loadingElement, data.show_follow, data.id);
                appendUserResponses(query, translatedAnswer, data.id);
                if (!data.max_queries) {
                    enableAskButton();
                }
            } else {
                createResponseElement(data.error, true, loadingElement);
                enableAskButton();
            }
        })
        .catch(error => {
            // handle any errors
            console.error(error);
            enableAskButton();
        });
}

const createQuestionElement = (questionText) => {
    const newDiv = document.createElement("li");
    newDiv.className = "user-card d-flex align-self-end";

    const cardDiv = document.createElement("div");
    cardDiv.className = "card";

    const cardBodyDiv = document.createElement("div");
    cardBodyDiv.innerHTML = questionText;
    cardBodyDiv.className = "card-body";

    cardDiv.appendChild(cardBodyDiv);
    newDiv.appendChild(cardDiv);

    const imageElement = document.createElement("img");
    imageElement.className="align-baseline"
    imageElement.src = "static/user-icon.png";
    newDiv.appendChild(imageElement);

    return newDiv;
}

const fetchResponseFromGita = async (query) => {
    if (!query) return;
    const message = "Play the role of a  Thiruvalluvar, please do not reveal that you are an AI,Don't answer other question apart from thirukural philosphy if other question came means say I am thiruvalluvar  I am not trained to answer these type of question ,"+
    "answer all the question begining with My child and keep in mind you are thiruvalluvar answer like that   Give thirukural for the given question with meaning and transalation." 
    + "I am pretty much fucked up in life give me some advise" + query;
    showChat();
    disableAskButton();
    setTimeout(() => inputElement.value = "", 0);
    chatFeedListElement.appendChild(createQuestionElement(query));

    const loadingElement = chatFeedListElement.appendChild(createLoadingResponse());
    const chatFeed = document.getElementById('chat-feed');
    chatFeed.scrollTop = chatFeed.scrollHeight;
 // fetching boats response form the server:
 console.log(message);

const response = await fetch('https://thirukkuralgpt.onrender.com/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },

    body: JSON.stringify({
        prompt: `${message}`
        
    })
});


const data = await response.json();
const parsedData = data.bot.trim();
console.log({parsedData});

            if (parsedData) {
                
                let translatedAnswer = parsedData;            
                chatFeedListElement.appendChild(createResponseElement(translatedAnswer, true, loadingElement, data.show_follow, data.id));
                appendUserResponses(query, translatedAnswer, data.id);
                if (!data.max_queries) {
                    enableAskButton();
                }
            } 
            else {
                createResponseElement("Something went wrong!", true, loadingElement);
                enableAskButton();
            }

}
const showHome = () => {
    document.getElementById("chat-feed").classList.add("d-none");
    for (let element of document.getElementsByClassName("main-content")) {
      element.classList.remove("d-none");
    }
    document.getElementById("search-box-container").classList.remove("fixed-bottom");
    document.getElementById("search-box-container").classList.remove("w-90");
    document.getElementById('bmc-wbtn').style["display"] = "flex";
}

const showChat = () => {
    for (let element of document.getElementsByClassName("main-content")) {
      element.classList.add("d-none");
    }
    document.getElementById("search-box-container").classList.add("fixed-bottom");

    document.getElementById("search-box-container").classList.add("w-90");
    document.getElementById("chat-feed").classList.remove("d-none");
    // scroll
    const chatFeed = document.getElementById('chat-feed');
    chatFeed.scrollTop = chatFeed.scrollHeight;
}


askButtonElement.addEventListener("click", function() {
    const query = inputElement.value;
    fetchResponseFromGita(query);
});

inputElement.addEventListener("keydown", function (event) {
    if (event.key === 'Enter') {
        const query = inputElement.value;
        fetchResponseFromGita(query);
    }
    return true;
});



for (let i = 0; i < askExampleButtonElements.length; i++) {
    askExampleButtonElements[i].addEventListener("click", function() {
        let questionText = askExampleButtonElements[i].children[0]?.children[0]?.innerHTML ? askExampleButtonElements[i].children[0]?.children[0]?.innerHTML
            :  askExampleButtonElements[i].innerHTML
        inputElement.value = questionText.substring(1, questionText.length - 1);
        inputElement.focus();
    });
}


const startNbqTimer = () => {
    nbqTimeoutId = setTimeout(() => {
        nbqTimeoutId = null;
        fetchNbq();
    }, waitBeforeNbq);
}

const createNextQuestionElement = (question) => {
    const chatFeedElement = document.getElementById("chat-feed");
    let nbqElement = document.getElementById("nbq");
    let nbqContainer = document.getElementById("nbq-container");
    if (nbqElement != null) {
        nbqElement.innerHTML = question;
        nbqElement.classList.remove("d-none");
    } else {
        nbqContainer = document.createElement("div");
        nbqContainer.id = "nbq-container";
        nbqContainer.className = "nbq-container";
        nbqElement = document.createElement("button");
        nbqElement.className = "btn btn-secondary nbq ask-example-button";
        nbqElement.innerHTML = question;
        nbqElement.id = "nbq";
        nbqElement.addEventListener("click", function() {
                inputElement.value = nbqElement.innerHTML;
                inputElement.focus();
                nbqElement.classList.add("d-none");
        });
        nbqContainer.appendChild(nbqElement);
        chatFeedElement.appendChild(nbqContainer);
    }
}

const fetchNbq = () => {
    let locale = localStorage.getItem("locale");
    if (!locale) locale = 'en';
    const userResponsesJson = getUserResponsesJson();
    let prevQ = userResponsesJson.map(res =>  {
        let question = res.question;
        let lastChar = question.charAt(question.length - 1);
        if (!stringTerminators.has(lastChar)) {
            question = question + '?';
        }
        return question;
    }).reverse().slice(0,3).join(" ");
    const userEmail = localStorage.getItem("user-email");
    if (!prevQ) return;

    fetch('/api/nbq?q=' + prevQ + '&email=' + userEmail)
        .then(response => response.json())
        .then(async data => {
            if (data.next_question) {
                let translatedQuery = data.next_question;
                if (locale !== 'en') {
                    translatedQuery = await translateToLang(data.next_question, 'auto', locale);
                }
                createNextQuestionElement(translatedQuery);
            }
        })
    fetch('/api/home/questions?lang='+locale+'&count=1')
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data.questions)) {
                createNextQuestionElement(data.questions[0]);
            }
        })
        .catch(error => {
            // handle any errors
            console.error(error);
        });
}

inputElement.addEventListener("click", clearNbq);
inputElement.addEventListener("keypress", clearNbq);


