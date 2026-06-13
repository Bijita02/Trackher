# Trackher
TrackHer is a smart menstrual wellness companion that combines cycle tracking with AI-driven insights. Designed to empower users with better understanding of their hormonal patterns, TrackHer provides intelligent predictions, symptom analysis, and personalized recommendations all in a secure and user-focused platform.
 ## Setup
  ### Backend 
     cd backend
     npm install express mongoose cors dotenv bcrypt jsonwebtoken
     npm install --save-dev nodemon
     
    
  ### Frontend
       cd frontend
       npm install 
       npm run dev
       npm install react-router-dom axios
       npm install recharts
       npm install tailwindcss
       npm install -D tailwindcss @tailwindcss/vite
      

## To Run
  ### Backend
      node sever.js

  ### Frontend 
      npm run dev

 ### Database Setup (Mongodb)
   1. npm install mongoose
   3. Create a `.env` file inside the "Trackher/Backend" folder and add:
      MONGO_URI=mongodb+srv://Your_project_name:password@project-name.wsftgiv.mongodb.net/project_name?retryWrites=true&w=majority&appName=project_name
      PORT=5000
      jwt_secret=your_secret_key