var current_day
var name
var channel
var bitsocket
var nameInput = document.getElementById('nameInput')
var channelInput = document.getElementById('channelInput')
var chatArea = document.getElementById('chatArea')
var messages = document.getElementById('messages')
var moneybutton = document.getElementById('moneybutton')
var messageContainer = document.getElementById('messageContainer')
var channelCloud = document.getElementById('channelCloud')
var content = document.getElementById('content')
var plop = new Audio('plop.mp3')
var linkifyOptions = {
    tagName: {
        mention: 'b'
    }
}
var emojiArea;


update()

channelInput.addEventListener("keyup", onChannelEnter)
nameInput.addEventListener("keyup", onNameEnter)

function update() {
    if (window.location.hash) {
        channel = window.location.hash
    }

    if (!name) {
        channelInput.style.display = 'hidden'
        nameInput.removeAttribute("style")
        nameInput.focus()
        nameInput.select()
    } else if (!channel) {
        showChannelSelect()
    } else {
        setChannel()
    }
}

function showChannelSelect() {
    nameInput.style.display = 'none';
    content.style.display = 'none';
    channelInput.removeAttribute("style")
    resetChannelInput()
    setCloudWords()
    channelInput.focus()
    channelInput.select()
}

function resetChannel() {
    channel = null;
    history.pushState("", document.title, window.location.pathname + window.location.search);
    update()
}

function onNameEnter(event) {
    if (event.keyCode === 13) {
        event.preventDefault()
        name = nameInput.value
        nameInput.style.display = 'none'
        update()
    }
}

function onChannelEnter(event) {
    if (event.keyCode === 13) {
        event.preventDefault()
        channel = channelInput.value
        window.location.href = channel
    }
}

function setChannel() {
    $(channelCloud).jQCloud('destroy');
    moveChannelInput()
    loadContent()
}

function moveChannelInput() {
    channelInput.value = channel
    channelInput.classList.remove('centered')
    channelInput.classList.add('title')
    channelInput.removeAttribute("style")
}

function resetChannelInput() {
    channelInput.value = null;
    channelInput.classList.remove('title');
    channelInput.classList.add('centered');
    channelInput.style.display = 'hidden';
}

function addHashtag() {
    var input = channelInput.value
    if (!input.startsWith('#')) {
        channelInput.value = '#' + input
    }
}

function loadContent() {
    content.removeAttribute("style")

    resetContent()
    loadMessages()
    initBitSocket()
    updateMoneyButton('')
    emojiArea = $(chatArea).emojioneArea({
        events: {
            emojibtn_click: function (editor, event) {
                requestAnimationFrame(() => {
                    updateMoneyButton(emojiArea[0].emojioneArea.getText());
                });
            },
            keyup: function (editor, event) {
                requestAnimationFrame(() => {
                    updateMoneyButton(emojiArea[0].emojioneArea.getText());
                });
            },
        }
    });
    focusChat()
}

function resetContent() {
    while (messages.firstChild) {
        messages.removeChild(messages.firstChild);
    }
    current_day = null;
}

function setCloudWords() {
    var cloudWords = [];
    var channels = {};
    var query = {
        v: 3,
        q: {
            find: {
                'out.s1': 'METATALK',
            },
            limit: 300
        }
    }
    var b64 = btoa(JSON.stringify(query))
    var url = 'https://chronos.bitdb.network/q/1P6o45vqLdo6X8HRCZk8XuDsniURmXqiXo/' + b64
    var config = {
        method: "GET",
        headers: { key: '1Fv74ecZUvXVJempfakNgFHgWzrpFEBuVm' }
    }

    fetch(url, config)
        .then(function(response) {
            return response.json()
        })
        .then(function(result) {
            const allResults = []
            if (result.t.length) {
                allResults.push(...result.t)
            }
            allResults.forEach(tx => {
                channels[tx.out[0].s3] = (channels[tx.out[0].s3] || 0) + 1;
            });
            for (var key in channels) {
                cloudWords.push({
                    'text': key,
                    'link': key,
                    'weight': channels[key]
                })
            }
            $(channelCloud).jQCloud(cloudWords, {
                'afterCloudRender': () => {
                    var cloud = $(channelCloud)
                    requestAnimationFrame(() => {
                        cloud.css('opacity', 1);
                    });
                }
            });
        })
}

function loadMessages() {
    var query = {
        v: 3,
        q: {
            find: {
                'out.s1': 'METATALK',
                'out.s3': channel
            },
            sort: {
                "timestamp": -1
            },
            limit: 200
        }
    }
    var b64 = btoa(JSON.stringify(query))
    var url = 'https://chronos.bitdb.network/q/1P6o45vqLdo6X8HRCZk8XuDsniURmXqiXo/' + b64
    var config = {
        method: "GET",
        headers: { key: '1Fv74ecZUvXVJempfakNgFHgWzrpFEBuVm' }
    }

    fetch(url, config)
        .then(function(response) {
            return response.json()
        })
        .then(function(result) {
            const allResults = []
            if (result.t.length) {
                allResults.push(...result.t)
            }
            allResults.reverse().forEach(tx => {
                appendTx(tx);
            });
            $("#messageContainer").scrollTop(1000000)
        })
}

function checkScrolledDown() {
    return (messageContainer.offsetHeight + messageContainer.scrollTop == messageContainer.scrollHeight);
}

function initBitSocket() {
    var query = {
        v: 3,
        q: {
            find: {
            'out.s1': 'METATALK',
            'out.s3': channel
            }
        }
    }

    if (bitsocket) {
        bitsocket.close()
    }

    // Encode it in base64 format
    var b64 = btoa(JSON.stringify(query));
    // Subscribe
    bitsocket = new EventSource(
        'https://chronos.bitdb.network/s/1P6o45vqLdo6X8HRCZk8XuDsniURmXqiXo/' + b64
    );
    // Event handler
    bitsocket.onmessage = function(e) {
        var isScrolledDown = checkScrolledDown()
        const data = JSON.parse(e.data);
        data.data.forEach(tx => {
            appendTx(tx);
            plop.play().catch(e => {
                console.log(e);
            });
        });
        if (isScrolledDown){
            $("#messageContainer").scrollTop(1000000);
        }
    };
}

function appendTx(tx) {
    var name = tx.out[0].s2;
    var tr = document.createElement("tr")
    var td_time = document.createElement("td")
    var td_name = document.createElement("td")
    var td_message = document.createElement("td")
    var name_button = document.createElement("button")
    name_button.classList.add('nameButton');
    var message_string = document.createTextNode(tx.out[0].s4)
    var name_string = document.createTextNode(name)

    var date = (tx.timestamp) ? (new Date(tx.timestamp)) : (tx.blk) ? (new Date(tx.blk.t)) : (none)

    var day = date.format('M jS')
    if (day && (day != current_day)) {
        appendDate(day);
        current_day = day;
    }

    var time_string = (date) ? document.createTextNode(date.format('H:i')) : "just now"

    td_message.appendChild(message_string)
    name_button.appendChild(name_string)
    td_name.appendChild(name_button)

    td_time.appendChild(time_string)
    tr.appendChild(td_time)
    tr.appendChild(td_name)
    tr.appendChild(td_message)
    messages.appendChild(tr)
    tr.style.opacity = 0;
    requestAnimationFrame(setOpacity);
    function setOpacity() {
        tr.style.opacity = 1;
    }

    $(td_message).linkify(linkifyOptions);
    name_button.innerHTML = emojione.toImage(td_name.innerHTML);
    td_message.innerHTML = emojione.toImage(td_message.innerHTML);

    $(name_button).click(function (){
        area = emojiArea[0].emojioneArea;
        area.setText(area.getText() + ('@' + name + ' '));
    });
}

function appendDate(string) {
    var gap = document.createElement("tr")
    var date_heading = document.createElement("h4")
    var date_string = document.createTextNode(string)
    gap.appendChild(date_heading)
    date_heading.appendChild(date_string)
    messages.appendChild(gap)
    gap.style.opacity = 0;
    requestAnimationFrame(() => {
        gap.style.opacity = 1;
    });
}

function updateMoneyButton(text){
    message = bsv.Script.buildDataOut(["METATALK", name, channel, text]).toASM()
    moneyButton.render(moneybutton, {
        successMessage: "Sent!",
        outputs: [{
            type: "USER",
            userId: "3553",
            amount: "0.005",
            currency: "USD"
        },
        {
            type: 'SCRIPT',
            script: message,
            amount: '0',
            currency: 'BSV'
        }],
        label: "Send",
        clientIdentifier: "36b563aee1b5d11a0693d79a582afccc",
        buttonId: "234325",
        onPayment: function (arg) {
            console.log('onPayment', arg)
            area = emojiArea[0].emojioneArea;
            area.setText('');
            focusChat();
        }
    })
}

function focusChat() {
    emojiArea[0].emojioneArea["editor"].focus()
}
