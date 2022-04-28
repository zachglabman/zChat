// Require the packages we will use:
const { RSA_PKCS1_PADDING } = require('constants');
const http = require('http'),
    url = require('url'),
    path = require('path'),
    mime = require('mime'),
    fs = require('fs');
const { exit } = require('process');

const port = 3456;
// used from individual portion so my server can render css and js dynamically from a static folder reference
const server = http.createServer(function(req, resp){
	const filename = path.join(__dirname, "chat-server", url.parse(req.url).pathname);
	(fs.exists || path.exists)(filename, function(exists){
		if (exists) {
			fs.readFile(filename, function(err, data){
				if (err) {
					// File exists but is not readable (permissions issue?)
					resp.writeHead(500, {
						"Content-Type": "text/plain"
					});
					resp.write("Internal server error: could not read file");
					resp.end();
					return;
				}
				
				// File exists and is readable
				const mimetype = mime.getType(filename);
				resp.writeHead(200, {
					"Content-Type": mimetype
				});
				resp.write(data);
				resp.end();
				return;
			});
		}
        else{
			// File does not exist
			resp.writeHead(404, {
				"Content-Type": "text/plain"
			});
			resp.write("Requested file not found: "+filename);
			resp.end();
			return;
		}
	});
});
server.listen(port);

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(http, {
    wsEngine: 'ws'
});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
let activeUsers = [];
    let rooms = [
        {'roomName' : 'Lobby', 'password' : '', 'owner' : '', 'banned' : [], 'currentUsers' : [], 'moderators':[]}
    ];
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.

    //server side when public message received
    socket.on('message_to_server', function (data) {

        console.log(`italic? ${data['italic']}, bold? ${data['bold']}, underline? ${data['underline']}`);

        if (data["message"] == ""){
            msg = `Why send a blank message? Try saying "Hello World" instead.`;
            socket.emit("error-message", msg);
            return;
        }

        let sender = getUserFromID(socket.id).username;
        let senderRoom = getUserFromID(socket.id).currentRoom;

        console.log("message: " + data["message"]);
        console.log("from: " + sender);
        
        io.sockets.in(senderRoom).emit("message_to_client", { message: data["message"], sender : sender, italic:data['italic'], bold:data['bold'], underline:data['underline']}) // broadcast the message to other users
    });

    //server side, when private message received
    socket.on('private_message_to_server', function (data) {

        let sender = getUserFromID(socket.id);
        let recipient = getUserFromUsername(data["recipient"]);

        if(recipient == null){
            msg = `User "${data["recipient"]}" not found!`;
            socket.emit("error-message", msg);
            return;
        }

        if (data["message"] == ""){
            msg = `Why send someone a blank message? Try saying "hi" instead.`;
            socket.emit("error-message", msg);
            return;
        }

        //if user is in same room as sender
        if (sender.currentRoom == recipient.currentRoom){
        console.log(`${sender.username} said ${data["message"]} to ${data["recipient"]}`);
        socket.emit("private_message_to_client", { message: data["message"], recipient: data["recipient"], sender: sender.username, all_users:activeUsers, italic:data['italic'], bold:data['bold'], underline:data['underline'] }); // broadcast to self
        io.sockets.to(recipient.id).emit("private_message_to_client", { message: data["message"], recipient: data["recipient"], sender: sender.username, all_users:activeUsers, italic:data['italic'], bold:data['bold'], underline:data['underline']}); // broadcast to specific user
        }
        else{
            msg = `You must be in the same room to send ${data["recipient"]} a message`;
            socket.emit("error-message", msg);
            return;
        }
    });

    // helper functions for getting info from other info (for arrays)
    function getUserFromUsername(targetUser){
        for (let i =0; i<activeUsers.length; i++){
            if (activeUsers[i].username == targetUser){
                return activeUsers[i];
            }
        }
        // return null;
    }

    function getIDFromName(targetUser){
        for (let i =0; i<activeUsers.length; i++){
            console.log(`${activeUsers[i].username}: ${activeUsers[i].id}`);
            if (activeUsers[i].username == targetUser){
                return activeUsers[i].id;
            }
        }
        // return null;
    }

    function getUserFromID(ID){
        for (let i =0; i<activeUsers.length; i++){
            if (activeUsers[i].id == ID){
                return activeUsers[i];
            }
        }
        // return null;
    }

    // function getCurrentRoomFromName(targetUser){
    //     for (let i =0; i<activeUsers.length; i++){
    //         if (activeUsers[i].username == targetUser){
    //             return activeUsers[i].currentRoom;
    //         }
    //     }
    //     return null;
    // }

    function getRoomFromRoomName(roomName){
        for (let i =0; i<rooms.length; i++){
            if (rooms[i].roomName == roomName){
                return rooms[i];
            }
        }
        // return null;
    }
    
    //server side login
    socket.on('login_server', function (data) {

        //format: [ {username, socket.id, currentRoom} ]
        activeUsers.push({
            username: data['current_user'],
            id: socket.id,
            currentRoom: 'Lobby'
        });

        getRoomFromRoomName('Lobby').currentUsers.push(data['current_user']);

        socket.join('Lobby');
        console.log(`Actives: ${activeUsers}`);
        console.log(`${data["current_user"]} (socket: ${socket.id}) logged in!`); // log it to the Node.JS output
        //this updates everyone's GUIs to show users in the lobby
        io.sockets.in('Lobby').emit("login_client", { current_user : data["current_user"], id : socket.id, currentRoom : 'Lobby', all_users : activeUsers, all_rooms : rooms });
    });
    //server side logout
    socket.on('logout_server', function () {
        // let user = getUserFromUsername(data["current_user"]);
        let user = getUserFromID(socket.id);
        let currentRoom = user.currentRoom;

        // console.log(`username: ${user.username}`);
        // console.log(`room: ${user.currentRoom}`);

        socket.leave(currentRoom);
        activeUsers.splice(activeUsers.indexOf(user),1);
        console.log(`${user.username} logged out!`); // log it to the Node.JS output
        //remove user from previous room's current users
        roomToRemoveUser = getRoomFromRoomName(currentRoom);
        roomToRemoveUser.currentUsers.splice(roomToRemoveUser.currentUsers.indexOf(user.username),1);
        
        socket.emit("logout_client", { current_user : user.username, all_users : activeUsers, all_rooms : rooms })
        io.sockets.in(currentRoom).emit("when-someone-logs-out", { current_user: user.username,current_room : currentRoom, all_users : activeUsers, all_rooms : rooms })
    });

    //JOINING AND LEAVING ROOMS (SERVER SIDE)
    //with some help from the socket.io docs (https://socket.io/docs/v3/rooms/)
    
    //create a room
    socket.on('create-room', function (data) {
        let user = getUserFromID(socket.id);
        let currentRoom = user.currentRoom;
        let msg;

        if (data['room'] == ""){
            msg = "Room name cannot be blank!";
            socket.emit("error-message", msg);
            return;
        }

        for (let i =0; i<rooms.length; i++){
            if (rooms[i].roomName == data['room']){
                msg = `Created ${data['room']}2.`;

                rooms.push({
                    roomName: `${data['room']}2`,
                    password: data['password'],
                    owner: getUserFromID(socket.id).username,
                    banned: [],
                    currentUsers : [],
                    moderators:[]
                });

                io.sockets.emit("client-room-created", {message:msg, id:socket.id, username:user.username, currentRoom:currentRoom, all_users : activeUsers, all_rooms : rooms});
                
                return;
            }
        }

        msg = `Created ${data['room']}.`;

        //format: [ {'roomName' : 'Lobby', 'password' : '', 'owner' : '', 'banned' : [], 'currentUsers' : []} ]
        rooms.push({
            roomName: data['room'],
            password: data['password'],
            owner: getUserFromID(socket.id).username,
            banned: [],
            currentUsers : [],
            moderators:[]
        });
        
        console.log(`${data["room"]} created!`); // log it to the Node.JS output

        io.sockets.emit("client-room-created", {message:msg, id:socket.id, username:user.username, currentRoom:currentRoom, all_users : activeUsers, all_rooms : rooms});

        // socket.join(roomName);
    });

    // // //join a room - leave previous room and join new one
    socket.on('join-room', function(roomName, password){ 
        let user = getUserFromID(socket.id);
        let prevRoom = user.currentRoom;
        let newRoom = getRoomFromRoomName(roomName);
        let msg;
        // if newRoom already exists
        if (newRoom != null){

            // check if user is banned
            for (let i = 0; i<newRoom.banned.length; i++){
                if (user.username==newRoom.banned[i]){
                    msg = "You're banned from this room!";
                    socket.emit("error-message", msg);
                    return;
                }
            }
        
            // check if user is the owner
            let isOwner = false;
            if (newRoom.owner == user.username){
                isOwner = true;
            }
            // check if user is a moderator
            let isModerator = false;
            for (let i = 0; i<newRoom.moderators.length;i++){
                if (newRoom.moderators[i] == user.username){
                    isModerator = true;
                }
            }

            // if room has a password
            if (newRoom.password != ''){
                let pass = password;
                if (pass == newRoom.password){
                    socket.leave(prevRoom);
                    socket.join(roomName);

                    //remove user from previous room's current users
                    roomToRemoveUser = getRoomFromRoomName(user.currentRoom);
                    roomToRemoveUser.currentUsers.splice(roomToRemoveUser.currentUsers.indexOf(user.username),1);
                    //keep track of where the user is, both in their current room attribute and in the rooms array
                    newRoom.currentUsers.push(user.username);
                    user.currentRoom = newRoom.roomName;

                    socket.emit("client-joined", {id:socket.id, username:user.username, prevRoom:prevRoom, newRoom:roomName, isOwner:isOwner, isModerator:isModerator, all_users : activeUsers, all_rooms : rooms});
                    io.sockets.in(roomName).emit("when-someone-joins", {id:socket.id, username:user.username, prevRoom:prevRoom, newRoom:roomName, all_users : activeUsers, all_rooms : rooms});
                    io.sockets.in(prevRoom).emit("client-left-room", {id:socket.id, username:user.username, prevRoom:prevRoom, newRoom:roomName, all_users : activeUsers, all_rooms : rooms});
                }
                else {
                    msg = "Wrong password!";
                    socket.emit("error-message", msg);
                }
            }
            else{
                socket.leave(prevRoom);
                socket.join(roomName);

                //remove user from previous room's current users
                roomToRemoveUser = getRoomFromRoomName(user.currentRoom);
                roomToRemoveUser.currentUsers.splice(roomToRemoveUser.currentUsers.indexOf(user.username),1);
                //keep track of where the user is, both in their current room attribute and in the rooms array
                newRoom.currentUsers.push(user.username);
                user.currentRoom = newRoom.roomName;

                socket.emit("client-joined", {id:socket.id, username:user.username, prevRoom:prevRoom, newRoom:roomName, isOwner:isOwner, isModerator:isModerator, all_users : activeUsers, all_rooms : rooms});
                io.sockets.in(roomName).emit("when-someone-joins", {id:socket.id, username:user.username, prevRoom:prevRoom, newRoom:roomName, isOwner:isOwner, all_users : activeUsers, all_rooms : rooms});
                io.sockets.in(prevRoom).emit("client-left-room", {id:socket.id, username:user.username, prevRoom:prevRoom, newRoom:roomName, all_users : activeUsers, all_rooms : rooms});
            }
            
        }
        else {
            let msg = "Room does not exist!";
            socket.emit("error-message", msg);
        }
    });

    socket.on("disconnect", function(){
        let user = getUserFromID(socket.id);
        if (user != null){
            let room = user.currentRoom;
            let roomToRemoveUser = getRoomFromRoomName(room);

            
            //remove user from arrays
            socket.leave(room);
            activeUsers.splice(activeUsers.indexOf(user),1);
            //remove user from previous room's current users
            
            roomToRemoveUser.currentUsers.splice(roomToRemoveUser.currentUsers.indexOf(user.username),1);

            io.sockets.in(room).emit("user-disconnect", {username:user.username, currentRoom:room, all_users:activeUsers, all_rooms:rooms});
            console.log(`${user.username} disconnected`);
        }
        
    });

    // kicking a user (banish them to the lobby)
    socket.on("kick-user", function(username){

         // check if blank
         if (username == ""){
            let msg = "Type a username to kick a user a from the room.";
            socket.emit("error-message", msg);
            return;
        }

        //check if user is actually in the room
        let user = getUserFromUsername(username);
        if (user != null){
        
            let prevRoom = user.currentRoom;
            let roomToRemoveUser = getRoomFromRoomName(user.currentRoom);
            let newRoom = getRoomFromRoomName('Lobby');
            let currentRoom = getUserFromID(socket.id).currentRoom;

            if (user.currentRoom == currentRoom){
                // trying to kick the owner?
                if (username == roomToRemoveUser.owner){
                    let msg = "You can't kick the owner.";
                    socket.emit("error-message", msg);
                    return;
                }

                // tell the user they've been removed, and get them to kick themselves
                io.sockets.to(user.id).emit("kicked-user", {kicked:true, username:username, prevRoom:prevRoom, newRoom:'Lobby', all_users : activeUsers, all_rooms : rooms});
            }
            else{
                msg = `You must be in the same room to kick ${user.username}!`;
                socket.emit("error-message", msg);
                return;
            }
        }
        else{
            let msg = "User does not exist!";
            socket.emit("error-message", msg);
        }
    });

    socket.on("youve-been-kicked", function(data){

        let user = getUserFromUsername(data['username']);
        let prevRoom = user.currentRoom;
        let roomToRemoveUser = getRoomFromRoomName(user.currentRoom);
        let newRoom = getRoomFromRoomName('Lobby');
        // let currentRoom = getUserFromID(socket.id).currentRoom;

        socket.leave(data['prevRoom']);
        socket.join(data['newRoom']);

        // for (let i =0; i< getRoomFromRoomName(data['prevRoom']).currentUsers.length; i++){
        //     console.log(`pre-splice user: ${getRoomFromRoomName(data['prevRoom']).currentUsers[i]}`);
        // }

        //remove user from previous room's current users
        getRoomFromRoomName(data['prevRoom']).currentUsers.splice(getRoomFromRoomName(data['prevRoom']).currentUsers.indexOf(user.username),1);
        //keep track of where the user is, both in their current room attribute and in the rooms array
        newRoom.currentUsers.push(user.username);
        user.currentRoom = 'Lobby';

        // for (let i =0; i< getRoomFromRoomName(data['prevRoom']).currentUsers.length; i++){
        //     console.log(`post-splice user in prevRoom: ${getRoomFromRoomName(data['prevRoom']).currentUsers[i]}`);
        // }

        // for (let i =0; i< getRoomFromRoomName('Lobby').currentUsers.length; i++){
        //     console.log(`post-splice user in Lobby: ${getRoomFromRoomName('Lobby').currentUsers[i]}`);
        // }

        // "joining" the kicked user to the lobby for them
        io.sockets.to(user.id).emit("client-joined", {kicked:data['kicked'], username:data['username'], prevRoom:data['prevRoom'], newRoom:data['newRoom'], all_users : activeUsers, all_rooms : rooms});
        io.sockets.in('Lobby').emit("when-someone-joins", {kicked:data['kicked'], username:data['username'], prevRoom:data['prevRoom'], newRoom:data['newRoom'], all_users : activeUsers, all_rooms : rooms});
        io.sockets.in(prevRoom).emit("client-left-room", {kicked:data['kicked'], username:data['username'], prevRoom:data['prevRoom'], newRoom:data['newRoom'], all_users : activeUsers, all_rooms : rooms});

    });


    // banning a user (they are not allowed to rejoin, added to banned users array)
    // users don't need to be in the same room to be banned from the room
    socket.on("ban-user", function(username){

        let user = getUserFromUsername(username);
        let prevRoom = user.currentRoom;
        let roomToRemoveUser = getRoomFromRoomName(user.currentRoom); //prevRoom object
        // let newRoom = getRoomFromRoomName('Lobby');

        // check if username is blank
        if (username == ""){
            let msg = "Type a username to ban a user from this room.";
            socket.emit("error-message", msg);
            return;
        }

        if (user != null){

            let currentRoom = getUserFromID(socket.id).currentRoom;
            
            // trying to ban owner
            if (username == getRoomFromRoomName(currentRoom).owner){
                let msg = "You can't ban the owner.";
                socket.emit("error-message", msg);
                return;
            }

            // if the users are in the same room (the room owner is banning them from)
            if (user.currentRoom == currentRoom){

                // tell the user they've been removed, and get them to kick themselves
                io.sockets.to(user.id).emit("banned-user", {inRoom:true, banned:true, username:username, prevRoom:prevRoom, newRoom:'Lobby', all_users : activeUsers, all_rooms : rooms});
            }
            else if (user.currentRoom != currentRoom){
                io.sockets.to(user.id).emit("banned-user", {inRoom:false, banned:true, username:username, prevRoom:currentRoom, newRoom:'Lobby', all_users : activeUsers, all_rooms : rooms});
            }
            // adding them to the list of banned users in the room's banned attribute
            getRoomFromRoomName(currentRoom).banned.push(username);
            let msg = `${username} has been banned from ${currentRoom}.`;
            socket.emit("add-message-to-chat", msg);
        }
        else{
            let msg = "User does not exist!";
            socket.emit("error-message", msg);
        }
    });

    socket.on("youve-been-banned", function(data){

        let user = getUserFromUsername(data['username']);
        let prevRoom = user.currentRoom;
        let roomToRemoveUser = getRoomFromRoomName(user.currentRoom);
        let newRoom = getRoomFromRoomName('Lobby');
        // let currentRoom = getUserFromID(socket.id).currentRoom;

        // if they were in the room they were banned from
        if (data['inRoom']==true){

        socket.leave(data['prevRoom']);
        socket.join(data['newRoom']);

        //remove user from previous room's current users
        getRoomFromRoomName(data['prevRoom']).currentUsers.splice(getRoomFromRoomName(data['prevRoom']).currentUsers.indexOf(user.username),1);
        //keep track of where the user is, both in their current room attribute and in the rooms array
        newRoom.currentUsers.push(user.username);
        user.currentRoom = 'Lobby';

        // "joining" the kicked user to the lobby for them
        io.sockets.to(user.id).emit("client-joined", {banned:data['banned'], username:data['username'], prevRoom:data['prevRoom'], newRoom:data['newRoom'], all_users : activeUsers, all_rooms : rooms});
        io.sockets.in('Lobby').emit("when-someone-joins", {banned:data['banned'], username:data['username'], prevRoom:data['prevRoom'], newRoom:data['newRoom'], all_users : activeUsers, all_rooms : rooms});
        io.sockets.in(prevRoom).emit("client-left-room", {banned:data['banned'], username:data['username'], prevRoom:data['prevRoom'], newRoom:data['newRoom'], all_users : activeUsers, all_rooms : rooms});
    }

        
    });
    

    // unbanning a user (they get removed from banned array) - do we need this?
    // socket.on("unban-user", function(username){
    //     let user = getUserFromID(socket.id);
    //     if (user != null){
    //         let room = user.currentRoom;
    //         //remove user from arrays
    //         socket.leave(room);
    //         io.sockets.to(room).emit("user-disconnect", user.username);
    //         activeUsers.splice(activeUsers.indexOf(user),1);
    //         //remove user from previous room's current users
    //         roomToRemoveUser = getRoomFromRoomName(room);
    //         roomToRemoveUser.currentUsers.splice(roomToRemoveUser.currentUsers.indexOf(user.username),1);

    //         console.log(`${user.username} disconnected`);
    //     }
        
    // });

    // make any active user a moderator (they are allowed to kick people (except owner))
    socket.on("mod-user", function(username){

        // check if username is blank
        if (username == ""){
            let msg = "Type a username to make a user a moderator.";
            socket.emit("error-message", msg);
            return;
        }

        let user = getUserFromUsername(username);
        let currentRoom = getUserFromID(socket.id).currentRoom;
        let roomObject = getRoomFromRoomName(currentRoom);

        // trying to made owner a moderator (self)
        if (username == roomObject.owner){
            let msg = "Owner alreaedy has admin privileges.";
            socket.emit("error-message", msg);
            return;
        }

        if (user != null){
        
            roomObject.moderators.push(username);
            // if they are in currentRoom, show relevant elements
            let inRoom = false;
            if (user.currentRoom ==currentRoom){
                inRoom = true;
            }
        let msg = `${username} has been made a moderator of ${currentRoom}.`;
        socket.emit("add-message-to-chat", msg);

        io.sockets.to(user.id).emit("mod-success", {username:username, modRoom:currentRoom, inRoom:inRoom, all_users : activeUsers, all_rooms : rooms});
        }

        else{
            let msg = "User does not exist!";
            socket.emit("error-message", msg);
        }
    });

    //creative portion - make other users a moderator of chat?
    //1. add mod array within room
    //2. owner can add mods
    //3. mods have ability to kick everyone except the owner

    //creative portion - make text boldable, italicizable and underlineable
});