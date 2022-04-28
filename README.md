
# CSE330

Zach Glabman 466464 zachglabman

Justin Novellas 486351 jj4619

  
# Module 6 - ZOL

- Passed the validator
- node_modules is in my .gitignore file

##  How to use "zChat"
**1.** Clone my [repo](https://github.com/cse330-spring-2022/module6-group-m6-466464-486351).
**2.** You may need to install dependency packages mime, socket and path (as specified in my package.json file)
**3.** cd into the folder, open a terminal and run "node chat-server.js".
**4.** Since my chat-server serves up a static folder, you will need to navigate to [localhost:3456/client.html](localhost:3456/client.html) in order to get started.
  

## Walking through the functionality

### Logging in / out, disconnecting
**1.** Enter a username to log in.
	**a.** A user object is created and stored in a "users" array on the server side, for later.
	**b.** Every user is dropped into 'Lobby'.
**2.** Click "Logout" in top right to return to login flow.
	**a.** This terminates the session and creates a new socketID for the next person who logs in.
	**b** User is removed from the users array, and user is removed from room they were just in.
**3.** "Disconnect" is effectively the same as Logout.

### Creating a room
**1.** Enter a room name (and no password) to create a public room.
**2.** Enter a room name and password to create a private room.
	**a.** A password-protected room will render as "roomName (private)" in the room list.

### Joining a room
**1.** Join rooms by typing room name into the relevant text box and clicking "join".
	**a.**  Anyone can join a public room, except for banned users. 
	**b.** Enter the correct password to join a private room.
**2.** If the room does not exist, you will get an error message.
**3.** If you join a room you created (i.e. you are the owner), you will have the ability to ban, kick and make a user a moderator.
	**a.** You dont have to be in the same room as someone to ban them, or make them a moderator.
	**b.** You cannot kick or ban the owner.
**4.** If you join a room you moderate, you will have the ability to kick users.
	**a.** You cannot kick the owner.

## Creative Portion

>Tried my best to make it look like AOL chat, so part of my creative was aesthetics and improving usability of the site for people who step into it for the first time. I spent extra time here with if statements and trickier socket.emits, so this part took more time than anticipated.

- Customized messages
	- Select italic, bold, or underline to apply any one two or all three font stylings to your message.
	- Send customized messages in public or private messages within a given socket.
- Moderation
	- Owner of a room can add moderators who have the ability to kick out other users (except for the owner)
	- Mods are added to the moderators attribute of the rooms array
	- When a client joins a room, it is checked whether they are a moderator and automatically renders the relevant information for them.
- Extra functionality, aesthetics
	- Login/Logout flow
		- User does not drop right into the chat - sever serves a static filesystem rather than a single file
		- Added "logout" button to make it feel more like AOL chat room
	- Dynamic rendering
		- With a mix of css and javascript, I was able to get all of the necessary moving pieces to render on the page when needed
		- I employ a mix of hiding unused blocks and populating with javscript on both the server and client sides
		- When a room has a password which is not blank, it will automatically say "(private)" next to the room, indicating it has a password.