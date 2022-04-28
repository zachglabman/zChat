// const { Socket } = require('socket.io');
// const socketio = io.connect();

// //helper functions (from my calendar project)
// function hide(element){
//     element.style.display = "none";
// }
// function show(element){
//     element.style.display = "block";
// }
// function clear(element){
//     element.value = "";
// }

// function rightNow(){
//     let date = new Date();
//     let now = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
//     return now;
// }


// //login - how to show chat only if "logged in" or if a username is entered
// /**
//  * JUST TYPE USERNAME INTO LOGIN BAR
//  * 1. add user to users table in m6 db?
//  * 2. if user exists, set logged_in to 1, else create user and set to 1?
//  * 3. do I need this functionality?
//  * 
//  */
// function loginUser() {
//     if (document.getElementById("login_username").value != ''){
//         current_user = document.getElementById("login_username").value;
//         socketio.emit("login_server", {current_user:current_user});
//         //is there a better way to do this?
//         localStorage.username = current_user;
//     }
//     else {
//         alert("Please enter a username to login.");
//     }
// }

// socketio.on("login_client",function(data) {
//     //clear and hide the login flow
//     clear(document.getElementById("login_username"));
//     hide(document.getElementById("login_details"));
//     show(document.getElementById("messaging"));
//     show(document.getElementById("gui"));

//     document.getElementById("current_user").innerText = data['current_user'];
//     show(document.getElementById("logout-btn"));
//     //Append an HR thematic break and the escaped HTML of the new message
//     document.getElementById("chatlog").appendChild(document.createElement("hr"));
//     document.getElementById("chatlog").appendChild(document.createTextNode(`${data['current_user']} has joined!`));
// });


// //logout!
// function logoutUser(){
//     if (localStorage.username != ''){
//         socketio.emit("logout_server", {current_user:localStorage.username});
        
//     }
// }

// socketio.on("logout_client",function(data) {
//     //clear current user
//     document.getElementById("current_user").innerText = '';
//     localStorage.username = '';
    
//     //rooms - keep track of which rooms a given user joins
//     //leave all rooms that this person was in
//     for (let i = 0; i<rooms.length; i++){
//         socket.leave(rooms[i])
//     }

//     //show login flow again
//     show(document.getElementById("login_details"));
//     hide(document.getElementById("messaging"));
//     hide(document.getElementById("gui"));
//     hide(document.getElementById("logout-btn"));

//     //Append an HR thematic break and the escaped HTML of the new message
//     document.getElementById("chatlog").appendChild(document.createElement("hr"));
//     document.getElementById("chatlog").appendChild(document.createTextNode(`${data['current_user']} left the chat.`));
// });

// // sending messages to frontend
// function sendMessage(){
//     if (localStorage.current_user = ''){
//         alert("Please login to send messages!");
//     }
//     else{
//     let msg = document.getElementById("message_input").value;
//     let recipient = document.getElementById("message_recipient").value;

//     //if no recipient specified, send to everyone by default
//     if (recipient == "" || recipient == "everyone"){
//     socketio.emit("message_to_server", {message:msg});
//     }
//     //else if a user is specified, only send to them and the sender
//     else if (recipient != "" && recipient != "everyone"){
//         socketio.emit("private_message_to_server", {message:msg, recipient:recipient, sender:localStorage.current_user});
//     }
//     }
// }

// socketio.on("message_to_client",function(data) {
//     //Append an HR thematic break and the escaped HTML of the new message
//     document.getElementById("chatlog").appendChild(document.createElement("hr"));
//     document.getElementById("chatlog").appendChild(document.createElement("div"));
//     document.getElementById("chatlog").appendChild(document.createTextNode(`${data['sender']}, ${rightNow()}: ${data['message']}`));
// });

// //need to add a few frontend things so we know to use this
// socketio.on("private_message_to_client",function(data) {
//     //Append an HR thematic break and the escaped HTML of the new message
//     if (localStorage.current_user == data['recipient']){
//     document.getElementById("chatlog").appendChild(document.createElement("hr"));
//     document.getElementById("chatlog").appendChild(document.createTextNode(`${data['sender']}, ${rightNow()}: ${data['message']}`));
//     }

//     else if (localStorage.current_user == data['sender']){
//     document.getElementById("chatlog").appendChild(document.createElement("hr"));
//     document.getElementById("chatlog").appendChild(document.createTextNode(`${data['sender']}, ${rightNow()}: ${data['message']}`));
//     }
// });

// // function joinRoom() {
// //     let room = document.getElementById("room-to-join").value;
// // }

// // socketio.on("client-joined", function(data){
// //     console.log(`${data['user']}`)
// //     document.getElementById("room-title").innerText = data['roomName'];
// // });

// //create room (must be logged in)
// /**
//  * 1. room name (required)
//  * 2. private or public? (required)
//  * 3. if private, require password (display:block if private is selected, else display:none)
//  * 
//  */

// //display all users - displays all users currently in a room (kinda like updateCalendar from last unit)
// /**
//  * INITIAL THOUGHTS
//  * show online users by adding all to an array
//  */

// // database
// /**
//  * TABLES
//  * 
//  * 1. users
//  * a. username
//  * b. anything else?
//  * 
//  * 2. rooms
//  * a. room name (required)
//  * b. private? (0 or 1, 0 meaning public)
//  * c. password (if private, needs a password)
//  */

//  document.getElementById("logout-btn").addEventListener("click",logoutUser,false);
//  document.getElementById("login-btn").addEventListener("click",loginUser,false);
//  document.getElementById("send-msg-btn").addEventListener("click",sendMessage,false);