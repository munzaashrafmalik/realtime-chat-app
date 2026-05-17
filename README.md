# Real-time Chat Application

A full-stack real-time chat application built with React, Node.js, Express, Socket.io, and MongoDB.

## Features

✅ **User Authentication**
- Register new account
- Login with email and password
- JWT-based authentication
- Protected routes

✅ **Real-time Messaging**
- Instant message delivery using Socket.io
- One-on-one chat
- Message history
- Typing indicators

✅ **User Presence**
- Online/offline status
- Real-time status updates
- Last seen timestamps

✅ **Modern UI**
- Responsive design with TailwindCSS
- Clean and intuitive interface
- User avatars
- Message timestamps

## Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- Socket.io Client
- React Router DOM
- Axios

### Backend
- Node.js
- Express
- Socket.io
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt for password hashing

## Project Structure

```
realtime-chat-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── messageController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── messageRoutes.js
│   │   └── userRoutes.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatWindow.jsx
    │   │   ├── UserList.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Chat.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env
    └── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the repository
```bash
cd realtime-chat-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/realtime-chat
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

**Important:** Make sure MongoDB is running on your system.

Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal and navigate to frontend:
```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Usage

1. **Register a new account**
   - Open `http://localhost:5173` in your browser
   - Click on "Register" and create a new account
   - You'll be automatically logged in after registration

2. **Login**
   - Use your email and password to login
   - You'll be redirected to the chat interface

3. **Start Chatting**
   - Select a user from the left sidebar
   - Type your message and press Send
   - Messages are delivered in real-time
   - See typing indicators when the other user is typing
   - Online/offline status is updated automatically

## Testing the Real-time Features

To test real-time functionality:
1. Open the app in two different browsers (or incognito mode)
2. Register/login with two different accounts
3. Start chatting between the two accounts
4. You'll see:
   - Messages appear instantly
   - Typing indicators
   - Online/offline status changes

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID (protected)

### Messages
- `GET /api/messages/:userId` - Get messages with a user (protected)
- `POST /api/messages` - Send a message (protected)
- `PATCH /api/messages/:messageId/read` - Mark message as read (protected)

## Socket Events

### Client to Server
- `user_online` - User comes online
- `send_message` - Send a message
- `typing` - User is typing
- `message_read` - Mark message as read
- `disconnect` - User disconnects

### Server to Client
- `online_users` - List of online users
- `user_status_change` - User status changed
- `receive_message` - Receive a message
- `message_sent` - Message sent confirmation
- `user_typing` - User typing status
- `message_read_confirmation` - Message read confirmation

## Future Enhancements

- Group chat functionality
- File/image sharing
- Voice/video calls
- Message reactions
- Search messages
- Delete messages
- Edit messages
- Push notifications
- Read receipts
- Message encryption

## Skills Learned

By building this project, you've learned:
- Real-time communication with WebSockets
- User authentication with JWT
- RESTful API design
- State management with React Context
- MongoDB database design
- Socket.io implementation
- Protected routes
- File structure for full-stack apps

## Troubleshooting

**MongoDB Connection Error:**
- Make sure MongoDB is running
- Check your MONGODB_URI in .env file

**Socket Connection Error:**
- Verify backend is running on port 5000
- Check VITE_SOCKET_URL in frontend .env

**CORS Error:**
- Backend is configured for `http://localhost:5173`
- If using different port, update in `server.js`

## License

MIT

---

**Congratulations!** You've built a complete real-time chat application. This project demonstrates your full-stack development skills and is a great addition to your portfolio! 🎉
