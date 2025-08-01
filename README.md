# 🏥 מערכת ניהול תורים מתקדמת

מערכת ניהול תורים מודרנית ומתקדמת המיועדת למוסדות רפואיים, עם ממשק קיוסק מקצועי ותמיכה בזמן אמת.

## ✨ תכונות עיקריות

### 🎯 **ניהול תורים מתקדם**
- **הרשמה מהירה** - ממשק קיוסק אינטואיטיבי
- **ניהול חדרים** - תמיכה במספר חדרים במקביל
- **תור חכם** - מערכת תורים אוטומטית
- **עדיפויות** - אפשרות לסימון מטופלים מועדפים

### 📺 **מסך תצוגה מקצועי**
- **עיצוב קיוסק** - רקע כהה ומקצועי
- **שעון דיגיטלי** - תצוגת זמן ותאריך
- **רצועת חדשות** - עדכונים נגללים
- **תצוגה מלאה** - אוטומטית למסך מלא

### 👨‍💼 **פאנל ניהול**
- **ניהול משתמשים** - הוספה, עריכה ומחיקה
- **ניהול חדרים** - יצירה ומחיקה של חדרים
- **ניהול חדשות** - פרסום עדכונים
- **סטטיסטיקות** - סקירה כללית של המערכת

### 🏥 **פאנל חדר**
- **קבלת מטופלים** - מעבר מטופלים לטיפול
- **ניהול תור** - העברה, עדיפות ומחיקה
- **השלמת טיפול** - סיום טיפול ומעבר למטופל הבא
- **העברת חדרים** - העברת מטופלים בין חדרים

## 🚀 התקנה והפעלה

### דרישות מערכת
- Node.js (גרסה 14 ומעלה)
- npm או yarn

### התקנה
```bash
# שכפול הפרויקט
git clone https://github.com/yourusername/queue-management-system.git
cd queue-management-system

# התקנת תלויות
npm install

# יצירת משתמש מנהל ראשוני
node createAdmin.js

# יצירת נתונים ראשוניים (חדרים ומשתמשים)
node createInitialData.js

# הפעלת השרת
npm start
```

### גישה למערכת
- **מסך תצוגה:** http://localhost:8080/overview
- **הרשמה לתור:** http://localhost:8080/checkin
- **פאנל מנהל:** http://localhost:8080/admin
- **פאנל חדר:** http://localhost:8080/room

### פרטי כניסה ברירת מחדל
- **מנהל:** admin / admin123
- **משתמשי חדר:** room1 / room123, room2 / room123, וכו'

## 🌐 Deployment

### Render (מומלץ)
הפרויקט מוכן ל-deployment על Render:

1. **צור חשבון ב-Render** - https://render.com
2. **חבר את ה-GitHub repository**
3. **בחר "Web Service"**
4. **הגדר את הפרמטרים:**
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     - `NODE_ENV=production`
     - `SESSION_SECRET=your-secret-key`

### Heroku
```bash
# התקן Heroku CLI
heroku create your-app-name
git push heroku main
```

### VPS/Server
```bash
# העתק את הקבצים לשרת
scp -r . user@your-server:/path/to/app

# התקן Node.js ו-npm
sudo apt update
sudo apt install nodejs npm

# הפעל את האפליקציה
npm install
npm start
```

## 🛠️ טכנולוגיות

### Backend
- **Node.js** - סביבת ריצה
- **Express.js** - מסגרת עבודה
- **Socket.IO** - תקשורת בזמן אמת
- **SQLite** - בסיס נתונים
- **Sequelize** - ORM

### Frontend
- **EJS** - תבניות HTML
- **CSS3** - עיצוב מתקדם
- **JavaScript** - אינטראקציה
- **Font Awesome** - אייקונים

### תכונות נוספות
- **Responsive Design** - תמיכה במובייל
- **Real-time Updates** - עדכונים בזמן אמת
- **Audio Notifications** - התראות קוליות
- **Fullscreen Mode** - מצב מסך מלא לקיוסק

## 📁 מבנה הפרויקט

```
queue-management-system/
├── config/
│   └── db.js                 # הגדרות בסיס נתונים
├── models/
│   ├── User.js              # מודל משתמש
│   ├── Room.js              # מודל חדר
│   ├── Appointment.js       # מודל תור
│   └── News.js              # מודל חדשות
├── routes/
│   ├── auth.js              # אימות משתמשים
│   ├── admin.js             # ניהול מערכת
│   └── queue.js             # ניהול תורים
├── views/
│   ├── login.ejs            # דף התחברות
│   ├── overview.ejs         # מסך תצוגה
│   ├── appointment.ejs      # דף הרשמה
│   ├── adminPanel.ejs       # פאנל מנהל
│   └── roomPanel.ejs        # פאנל חדר
├── public/
│   └── css/
│       └── style.css        # עיצוב ראשי
├── createAdmin.js           # יצירת מנהל ראשוני
├── createInitialData.js     # יצירת נתונים ראשוניים
├── server.js                # שרת ראשי
├── app.js                   # אפליקציה
└── package.json             # תלויות הפרויקט
```

## 🎨 עיצוב

### עקרונות עיצוב
- **עיצוב נקי** - ממשק מינימליסטי ומקצועי
- **צבעים מודרניים** - פלטת צבעים מתקדמת
- **אנימציות חלקות** - מעברים טבעיים
- **טיפוגרפיה ברורה** - קריאות מקסימלית

### תמיכה במכשירים
- **דסקטופ** - תצוגה מלאה עם כל התכונות
- **טאבלט** - התאמה אופטימלית למסך בינוני
- **מובייל** - ממשק מותאם למסך קטן
- **קיוסק** - מצב מסך מלא עם ניווט מוגבל

## 🔧 הגדרות

### משתני סביבה
```bash
PORT=8080                    # פורט השרת
NODE_ENV=production          # סביבת עבודה
```

### הגדרות בסיס נתונים
- **SQLite** - בסיס נתונים קובץ (ברירת מחדל)
- **תמיכה ב-MongoDB** - ניתן להחליף בקלות

## 📊 סטטיסטיקות

### ביצועים
- **זמן טעינה** - פחות מ-2 שניות
- **עדכונים בזמן אמת** - כל 15 שניות
- **תמיכה במשתמשים** - עד 1000 משתמשים במקביל

### אבטחה
- **הצפנת סיסמאות** - bcrypt
- **ניהול סשנים** - Express Session
- **אימות משתמשים** - מערכת הרשאות

## 🤝 תרומה לפרויקט

אנחנו שמחים לקבל תרומות! כדי לתרום:

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/AmazingFeature`)
3. Commit את השינויים (`git commit -m 'Add some AmazingFeature'`)
4. Push ל-branch (`git push origin feature/AmazingFeature`)
5. פתח Pull Request

## 📝 רישיון

פרויקט זה מוגן תחת רישיון MIT. ראה קובץ `LICENSE` לפרטים נוספים.

## 📞 תמיכה

אם יש לך שאלות או בעיות:
- פתח Issue ב-GitHub
- צור קשר: your-email@example.com

## 🙏 תודות

תודה לכל התורמים והמשתמשים שתומכים בפרויקט!

---

**מערכת ניהול תורים מתקדמת** - פתרון מקצועי לניהול תורים במוסדות רפואיים 🏥 