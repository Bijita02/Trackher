# Trackher
TrackHer is a smart menstrual wellness companion that combines cycle tracking with AI-driven insights. Designed to empower users with better understanding of their hormonal patterns, TrackHer provides intelligent predictions, symptom analysis, and personalized recommendations all in a secure and user-focused platform.
 ## Setup
  ### Backend 
     cd backend
     npm install express mongoose cors dotenv bcrypt jsonwebtoken
     npm install --save-dev nodemon
     npm install google-auth-library
  ### Frontend
       cd frontend
       npm install 
       npm run dev
       npm install react-router-dom axios
       npm install recharts
       npm install tailwindcss
       npm install -D tailwindcss @tailwindcss/vite
       npm install @react-oauth/google axios

## To Run
  ### Backend
      node sever.js

  ### Frontend 
      npm run dev

 ### Database Setup (MySQL)
1. Create a free cluster in MongoDB Atlas

2. Create a database user (save username & password)

3. Allow network access:
   0.0.0.0/0

4. Go to Connect → Drivers → Node.js
   Copy the connection string and replace <password>

5. Create .env file inside "Trackher/Backend"
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string