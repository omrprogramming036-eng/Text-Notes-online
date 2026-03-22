const { useState, useEffect, useMemo } = React;

function App() {
  // --- States ---
  const [view, setView] = useState("login");
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  
  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [noteText, setNoteText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  // 1. التحقق من الجلسة وتنظيف البيانات
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("currentUser"));
    if (saved) {
      setUser(saved);
      // معالجة الملاحظات لضمان وجود ID فريد لكل واحدة
      const validNotes = (saved.notes || []).map(n => ({
        ...n,
        id: n.id || `note-${Math.random().toString(36).substr(2, 9)}`
      }));
      setNotes(validNotes);
      setView("app");
    }
  }, []);

  // 2. نظام الحسابات
  const handleAuth = () => {
    if (!email || !password) return alert("يرجى إكمال البيانات");
    let users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find(u => u.email === email);

    if (isRegister) {
      if (found) return alert("الحساب موجود بالفعل");
      const newUser = { email, password, notes: [] };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      setIsRegister(false);
      alert("تم التسجيل بنجاح!");
    } else {
      if (!found || found.password !== password) return alert("بيانات الدخول خاطئة");
      setUser(found);
      setNotes(found.notes || []);
      localStorage.setItem("currentUser", JSON.stringify(found));
      setView("app");
    }
  };

  // 3. إدارة الملاحظات والملفات
  const addNote = () => {
    if (!noteText.trim() && !attachedFile) return;

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text: noteText,
      file: attachedFile,
      fileName: fileName,
      date: new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
    };

    const updated = [newNote, ...notes];
    sync(updated);
    setNoteText("");
    setAttachedFile(null);
    setFileName("");
  };

  const deleteNote = (id) => {
    if (confirm("هل أنت متأكد من حذف هذه الملاحظة؟")) {
      const updated = notes.filter(n => n.id !== id);
      sync(updated);
    }
  };

  const sync = (newNotes) => {
    setNotes(newNotes);
    const updatedUser = { ...user, notes: newNotes };
    setUser(updatedUser);
    
    let users = JSON.parse(localStorage.getItem("users") || "[]");
    const idx = users.findIndex(u => u.email === user.email);
    if (idx !== -1) {
      users[idx] = updatedUser;
      localStorage.setItem("users", JSON.stringify(users));
    }
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (f) => setAttachedFile(f.target.result);
    reader.readAsDataURL(file);
  };

  const sendToDeveloper = (e) => {
    e.preventDefault();
    if (!contactMsg.trim()) return alert("يرجى كتابة رسالة أولاً");

    // تحضير البيانات للإرسال
    const templateParams = {
      email: user.email,
      message: contactMsg,
      name: "Developer",
    };

    emailjs.send(
      "service_pes24ix",   // استبدل بـ Service ID الخاص بك
      "template_11q0weq",  // استبدل بـ Template ID الخاص بك
      templateParams
    )
    .then((response) => {
       console.log('SUCCESS!', response.status, response.text);
       alert("تم إرسال رسالتك بنجاح! شكراً لتواصلك.");
       setContactMsg(""); // تفريغ الحقل بعد النجاح
    }, (err) => {
       console.log('FAILED...', err);
       alert("فشل الإرسال، يرجى التحقق من إعدادات EmailJS في الكود.");
    });
  };

  // --- Views ---

  if (view === "login") {
    return (
      <div style={styles.authWrapper}>
        <div style={styles.loginCard}>
          <h1 style={styles.title}>{isRegister ? "انضم إلينا" : "مرحباً بك"}</h1>
          <input style={styles.input} placeholder="البريد الإلكتروني" onChange={e => setEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="كلمة المرور" onChange={e => setPassword(e.target.value)} />
          <button style={styles.mainBtn} onClick={handleAuth}>{isRegister ? "إنشاء حساب" : "تسجيل الدخول"}</button>
          <p style={styles.toggle} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "لديك حساب؟ سجل دخولك" : "ليس لديك حساب؟ اصنع واحداً"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.brand}>SecureNotes ☁️</div>
        <button style={styles.logout} onClick={() => {localStorage.removeItem("currentUser"); setView("login");}}>خروج</button>
      </nav>

      <div style={styles.content}>
        {/* صندوق الكتابة */}
        <div style={styles.writeBox}>
          <textarea 
            style={styles.textInput} 
            placeholder="اكتب ملاحظة جديدة أو ارفع ملفاً..." 
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
          />
          <div style={styles.toolBar}>
            <label style={styles.fileLabel}>
              📎 {fileName ? "تغيير الملف" : "إرفاق ملف"}
              <input type="file" style={{display: 'none'}} onChange={handleFile} />
            </label>
            <button style={styles.saveBtn} onClick={addNote}>حفظ الملاحظة</button>
          </div>
          {fileName && <div style={styles.fileHint}>الملف المختار: {fileName}</div>}
        </div>

        {/* شبكة الملاحظات */}
        <div style={styles.grid}>
          {notes.map((n) => (
            <div key={n.id} style={styles.noteCard}>
              <button style={styles.delBtn} onClick={() => deleteNote(n.id)}>✕</button>
              <p style={styles.noteP}>{n.text}</p>
              {n.file && (
                n.file.includes("image") 
                ? <img src={n.file} style={styles.previewImg} alt="attachment" />
                : <div style={styles.fileStub}>📄 {n.fileName || "ملف مرفق"}</div>
              )}
              <div style={styles.noteDate}>{n.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* نموذج التواصل المطور (Support) */}
      <div style={styles.supportCard}>
        <h4 style={{margin: '0 0 10px 0'}}>تواصل مع المطور 💬</h4>
        <input 
          style={styles.chatInput} 
          placeholder="كيف يمكننا مساعدتك؟" 
          value={contactMsg}
          onChange={e => setContactMsg(e.target.value)}
        />
        <button style={styles.sendBtn} onClick={(e)=>sendToDeveloper(e)}>إرسال رسالة</button>
      </div>
    </div>
  );
}

// --- Styles (CSS-in-JS) ---
const styles = {
  authWrapper: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', direction: 'rtl' },
  loginCard: { background: 'rgba(255, 255, 255, 0.9)', padding: '40px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', width: '320px', textAlign: 'center', backdropFilter: 'blur(10px)' },
  title: { color: '#333', marginBottom: '20px', fontSize: '24px' },
  input: { width: '100%', padding: '12px', margin: '10px 0', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none' },
  mainBtn: { width: '100%', padding: '12px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: '0.3s' },
  toggle: { marginTop: '15px', color: '#667eea', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },

  appContainer: { minHeight: '100vh', background: '#f4f7f6', direction: 'rtl', fontFamily: 'Arial, sans-serif' },
  navbar: { background: '#fff', padding: '15px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  brand: { fontSize: '22px', fontWeight: 'bold', color: '#667eea' },
  logout: { background: '#ff4757', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: '8px', cursor: 'pointer' },

  content: { maxWidth: '900px', margin: '30px auto', padding: '0 20px' },
  writeBox: { background: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', marginBottom: '40px' },
  textInput: { width: '100%', height: '100px', border: 'none', outline: 'none', fontSize: '17px', resize: 'none', color: '#444' },
  toolBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' },
  fileLabel: { color: '#666', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  saveBtn: { background: '#05c46b', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' },
  fileHint: { fontSize: '12px', color: '#05c46b', marginTop: '8px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  noteCard: { background: '#fff', padding: '20px', borderRadius: '15px', position: 'relative', boxShadow: '0 3px 12px rgba(0,0,0,0.04)', animation: 'slideIn 0.4s ease-out' },
  delBtn: { position: 'absolute', top: '12px', left: '12px', background: '#f1f2f6', border: 'none', width: '25px', height: '25px', borderRadius: '50%', cursor: 'pointer', color: '#ff4757', fontSize: '12px' },
  noteP: { fontSize: '16px', color: '#2d3436', lineHeight: '1.6', margin: '10px 0' },
  previewImg: { width: '100%', borderRadius: '10px', marginTop: '10px', cursor: 'zoom-in' },
  fileStub: { background: '#f8f9fa', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#636e72', border: '1px dashed #ddd' },
  noteDate: { fontSize: '11px', color: '#b2bec3', marginTop: '15px' },

  supportCard: { position: 'fixed', bottom: '25px', left: '25px', width: '250px', background: '#fff', padding: '20px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: '1px solid #eee', zIndex: 100 },
  chatInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' },
  sendBtn: { width: '100%', background: '#667eea', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

// --- تشغيل ---
const root = ReactDOM.createRoot(document.querySelector(".root"));
root.render(<App />);