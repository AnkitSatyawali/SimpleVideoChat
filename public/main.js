let Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
const filter = document.querySelector('#filter')
const checkboxTheme = document.querySelector('#theme')
let client = {}
let currentFilter
let entered = false;



document.getElementById('vd').style.display='block';
mainFunction();


function mainFunction() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        socket.emit('NewClient');
        video.srcObject = stream
        video.play()

        filter.addEventListener('change', (event) => {
            currentFilter = event.target.value
            video.style.filter = currentFilter
            SendFilter(currentFilter)
            event.preventDefault
        })

        function InitPeer(type) {
            let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: stream, trickle: false })
            peer.on('stream', function (stream) {
                CreateVideo(stream)
            })
           
            peer.on('data', function (data) {
                let decodedData = new TextDecoder('utf-8').decode(data)
                let peervideo = document.querySelector('#peerVideo')
                peervideo.style.filter = decodedData
            })
            return peer
        }


        function MakePeer() {
            client.gotAnswer = false
            let peer = InitPeer('init')
            peer.on('signal', function (data) {
                if (!client.gotAnswer) {
                    socket.emit('Offer', data)
                }
            })
            client.peer = peer
        }


        function FrontAnswer(offer) {
            let peer = InitPeer('notInit')
            peer.on('signal', (data) => {
                socket.emit('Answer', data)
            })
            peer.signal(offer)
            client.peer = peer
             document.getElementById('instruction').style.display = 'none'
        }


        function SignalAnswer(answer) {
            client.gotAnswer = true
            let peer = client.peer
            peer.signal(answer)
            document.getElementById('instruction').style.display = 'none'
        }


        function CreateVideo(stream) {
            CreateDiv()

            let video = document.createElement('video')
            video.id = 'peerVideo'
            video.srcObject = stream
            video.setAttribute('class', 'embed-responsive-item')
            document.querySelector('#peerDiv').appendChild(video)
            video.play()

            setTimeout(() => SendFilter(currentFilter), 1000)

            video.addEventListener('click', () => {
                if (video.volume != 0)
                    video.volume = 0
                else
                    video.volume = 1
            })

        }


        function SessionActive() {
            document.getElementById('error').style.display='block'
            document.body.style.backgroundColor='black'
            document.body.style.color = 'white'
            document.getElementById('vd').style.display='none'
        }


        function SendFilter(filter) {
            if (client.peer) {
                client.peer.send(filter)
            }
        }


        function RemovePeer() {
            document.getElementById("peerVideo").remove();
            document.getElementById("muteText").remove();
            document.getElementById('instruction').style.display='block';
            if (client.peer) {
                client.peer.destroy()
            }
        }


        socket.on('BackOffer', FrontAnswer)
        socket.on('BackAnswer', SignalAnswer)
        socket.on('SessionActive', SessionActive)
        socket.on('CreatePeer', MakePeer)
        socket.on('Disconnect', RemovePeer)

    })
    .catch(err => document.write(err))
}


checkboxTheme.addEventListener('click', () => {
    if (checkboxTheme.checked == true) {
        document.body.style.backgroundColor = '#212529'
        if (document.querySelector('#muteText')) {
            document.querySelector('#muteText').style.color = "#fff"
        }

    }
    else {
        document.body.style.backgroundColor = '#fff'
        if (document.querySelector('#muteText')) {
            document.querySelector('#muteText').style.color = "#212529"
        }
    }
}
)


function CreateDiv() {
    let div = document.createElement('div')
    div.setAttribute('class', "centered")
    div.id = "muteText"
    div.innerHTML = "Click to Mute/Unmute"
    document.querySelector('#peerDiv').appendChild(div)
    if (checkboxTheme.checked == true)
        document.querySelector('#muteText').style.color = "#fff"
}
