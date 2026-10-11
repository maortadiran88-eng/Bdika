# קטלוג חלקי חילוף — VRF Parts Catalog

## מבנה הקבצים

```
📁 catalog/
  index.html          ← נקודת כניסה (CDN imports + Firebase init)
  README.md
  SECURITY.md         ← הפעלת מצב מאובטח (חינם)
  firestore.rules     ← כללי Firestore מוצעים
  📁 js/
    constants.js      ← קבועים, INIT, DCOLS, DCATS
    security.js       ← הצפנת סיסמאות, לוגיקת כניסה, כללי Firestore
    firebase.js       ← כל קריאות Firebase (fbLoad, fbSave, fbHist …)
    helpers.js        ← פונקציות עזר + Modal + style atoms
    components.js     ← LoginScreen, HomeScreen, SidebarBrand, CartPanel, NotificationsPanel
    modals.js         ← WaEditorModal, MoveModal, CopyPartsModal, BulkMove/Delete, XlsImport, BrandMgr, ChangePwd
    ModelView.js      ← טבלת החלקים המלאה + מצב נייד
    App.js            ← קומפוננטת הבסיס, state, ניתוב, Firebase auto-save
```

## העלאה ל-GitHub Pages

1. העלה את כל התיקייה לריפוזיטורי GitHub
2. Settings → Pages → Branch: main / (root)
3. הכנס לכתובת `https://<username>.github.io/<repo>/`

## סיסמאות

הסיסמאות מנוהלות מתוך האתר (תפריט ⋮ ← 👥 ניהול משתמשים) ונשמרות מוצפנות.
**אין לשמור סיסמאות בקוד או ב-README.** פרטים נוספים ב-`SECURITY.md`.

## Firebase

הפרויקט כבר מוגדר לחשבון Firebase של תדיראן.
לשינוי — ערוך את בלוק `firebase.initializeApp(...)` בתחילת `index.html`.
