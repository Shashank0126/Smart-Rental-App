# 🏠 Smart Rental – AI-Powered Rental Management System

Smart Rental is a full-stack web application that simplifies property renting by integrating **AI-driven insights, real-time communication, and role-based management**. The platform enables users to search and discover rental properties, owners to manage listings, and admins to monitor and control the system efficiently.

---

## 🚀 Features

### 👤 User

* Search and filter properties by location, price, type, and amenities
* View detailed listings with images, reviews, and ratings
* Add/remove favorites
* Get personalized property recommendations
* Real-time chat with property owners
* Notification system for updates and messages

### 🏢 Owner

* Create, update, and delete property listings
* Upload images using cloud storage
* View and respond to user inquiries
* Track dashboard statistics (properties, inquiries, flagged listings)

### 🛠️ Admin

* Approve or reject owner registrations
* Manage users and property listings
* Flag suspicious or fraudulent listings
* View analytics dashboard

---

## 🤖 AI Capabilities

* **Rent Prediction Model**

  * Predicts rental price based on property type, size, city, and amenities
  * Provides estimated range with confidence level

* **Recommendation System**

  * Content-based filtering using user preferences
  * Suggests similar properties based on favorites

* **Fraud Detection**

  * Identifies duplicate listings
  * Detects unrealistic pricing

---

## 💬 Real-Time Features

* WebSocket-based chat system for instant messaging
* In-app notifications for messages and updates

---

## 🧰 Tech Stack

### Frontend

* React.js
* Axios
* Tailwind CSS

### Backend

* FastAPI
* Python

### Database

* MongoDB

### AI/ML

* Scikit-learn
* NumPy, Pandas

### Cloud & Services

* Cloudinary (image storage)
* WebSockets (real-time communication)

---

## 🔐 Security

* JWT-based authentication
* Role-based access control (Admin, Owner, User)
* Password hashing using bcrypt

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/smart-rental.git
cd smart-rental
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Environment Variables

Create a `.env` file in backend:

```
MONGODB_URI=your_mongodb_url
DB_NAME=smart_rental
JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FRONTEND_URL=http://localhost:5173
```

---

## 📌 Future Enhancements

* Map integration for property locations
* Payment gateway for booking
* Advanced ML models for pricing
* Mobile application support

---

## 📄 License

This project is for educational and demonstration purposes.

---

## 👨‍💻 Author

Developed by P.Shashank,A.Sadhvika 

---
