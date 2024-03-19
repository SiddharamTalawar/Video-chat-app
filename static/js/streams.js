const APP_ID = '26eccebddc0c4fafbec2aaff4ec25402'
const TOKEN = sessionStorage.getItem('token')
const CHANNEL = sessionStorage.getItem('room')
let UID = sessionStorage.getItem('UID')

let NAME = sessionStorage.getItem('name')

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'}) //client obj gives local client access to create /join video stream, or subscribe to stream.
// there are 2 types of modes one is rtc,
//codec is the type of encoading we use i.e vp8


let localTracks = [] //for storing our audio and video
let remoteUsers = {} //for storing other peoples audio and video

joinAndDisplayLocalStream = async () => {                   //joining a local stream.

   client.on('user-published', handleUserJoined) //creating a event listner to handel remote users who join channel, 'user-published' refer to 
   //"await client.publish([localTracks[0], localTracks[1]])"
   //that is when a client joins/starts a stream

   client.on('user-left', handleUserLeft) //subscrbing to an event to handel users that leave

   // UID = await client.join(APP_ID, CHANNEL, TOKEN, UID) //to join all these parameter are required if we give UID as null then it will genarate a new UID for us
   await client.join(APP_ID, CHANNEL, TOKEN, UID) //joining

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks() // storing our audio and video tracks
    //this will ask our permission to access audio and video or genarate audio and video tracks
    //creating a video player.
    let player = `<div  class="video-container" id="user-container-${UID}"> 
    <div class="video-player" id="user-${UID}"></div>
    <div class="username-wrapper"><span class="user-name"></span></div>
 </div>`
// adding video palyer in webpage
document.getElementById('video-streams').insertAdjacentHTML('beforeend', player) 

//localTracks will have 2 elements on 0 index will be our audio and on 1 index wiil be our video.

localTracks[1].play(`user-${UID}`) // play method will create an html element/ video tag and it will take argument containing unique id where the video wil be palyed.
//adding/playing our video, but only we can see it. (may be the reson why we are only playing our video and not audio is because we don't want to listen to our own audio)

//let member = await createMember() //saving name into db

//below we are publishing our audio and video to chanel/client obj so that other users in that chanel can see it.
await client.publish([localTracks[0], localTracks[1]])
}

//NOTE : we need to give video palyer css hight and width else it won't apper/display.

// creating a function to handel remote user joining the stream.
let handleUserJoined = async (user, mediaType) => {        //takes 2 arguments
   remoteUsers[user.uid] = user                             //storing user in remoteusers
   await client.subscribe(user, mediaType)                 // subscrbing to the client/chanel/stream

   //handling video
   if (mediaType === 'video'){
       let player = document.getElementById(`user-container-${user.uid}`)
       if (player != null){         //checking if users player is alredy present, 
           player.remove()           // if it is we will remove it.
       }

       //let member = await getMember(user)

       //when user refreshes the page we remove his video player and rebuild it again so to not have multiple video players of the same user.
      //bulding the video palyer for remote user.
       player = `<div  class="video-container" id="user-container-${user.uid}">
           <div class="video-player" id="user-${user.uid}"></div>
           <div class="username-wrapper"><span class="user-name"></span></div>
       </div>`

       document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
       user.videoTrack.play(`user-${user.uid}`)
   }
   //handling audio
   if (mediaType === 'audio'){
       user.audioTrack.play()
   }

}


// function to handel users that leave
let handleUserLeft = async (user) => {
   delete remoteUsers[user.uid]                                  //remove user from remoteUsers
   document.getElementById(`user-container-${user.uid}`).remove()//removing users video player
}


// fun to leave stream 
//check local tracks and check if audio and video is present if present stop and close them 
let leaveAndRemoveLocalStream = async () => {
   for (let i=0; localTracks.length > i; i++){
       localTracks[i].stop()       //we can restart again if we stop here
       localTracks[i].close()      //but if we close then we need to create new ones
   }

   //await client.leave()
   //This is somewhat of an issue because if user leaves without actaull pressing leave button, it will not trigger
   //deleteMember()
   window.open('/', '_self')  //readirecting to the lobby
}


//function to toggle camera
let toggleCamera = async (e) => {
   console.log('TOGGLE CAMERA TRIGGERED')
   if(localTracks[1].muted){              //localtrack[1] is video, muted means it is turnedoff
       await localTracks[1].setMuted(false) //turn on camera
       e.target.style.backgroundColor = '#fff' //change button color to white
   }else{
       await localTracks[1].setMuted(true)  //turn off camera
       e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)' //changebutton color to red
   }
}

//toggleing the mic
let toggleMic = async (e) => {
   console.log('TOGGLE MIC TRIGGERED')
   if(localTracks[0].muted){       //localtrack[0] is audio, muted means it is turnedoff
       await localTracks[0].setMuted(false)
       e.target.style.backgroundColor = '#fff'
   }else{
       await localTracks[0].setMuted(true)
       e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
   }
}

let createMember = async () => {
    let response = await fetch('/create_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
    return member
}

let getMember = async (user) => {
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
}

//window.addEventListener("beforeunload",deleteMember);

joinAndDisplayLocalStream()

document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)