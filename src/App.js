import React, { useState } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import './App.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const handleVoiceInput = () => {
    if (!SpeechRecognition) {
      setError('المتصفح لا يدعم التعرف على الصوت.');
      return;
    }
  
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.start();
  
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };
  
    recognition.onerror = (event) => {
      setError('حدث خطأ أثناء استخدام الميكروفون.');
      console.error(event);
    };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setError('');
    setQuestion('');

    Tesseract.recognize(file, 'eng+ara', {
      logger: m => console.log(m)
    }).then(({ data: { text } }) => {
      setQuestion(text.trim());
      setOcrLoading(false);
    }).catch(err => {
      console.error(err);
      setError('حدث خطأ أثناء قراءة الصورة.');
      setOcrLoading(false);
    });
  };

  const handleSolve = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    console.log("API Key:", apiKey); // <-- هنا نطبع المفتاح
  
    if (!question) return;
  
    setLoading(true);
    setAnswer('');
    setError('');
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `أوجد ناتج المعادلة التالية: ${question}`,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      setAnswer(response.data.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Error:', error);
      if (error.response && error.response.status === 429) {
        setError('لقد تم إرسال عدد كبير من الطلبات. الرجاء الانتظار قليلاً ثم المحاولة مجددًا.');
      } else {
        setError('حدث خطأ أثناء الاتصال بالخدمة.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="App">
      <h1>AI Math Helper</h1>

      <input
        type="text"
        placeholder="اكتب المعادلة هنا"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div style={{ marginBottom: '15px' }}>
        <button onClick={handleVoiceInput} style={{ marginRight: '10px' }}>
          تحدث المعادلة
        </button>
        <button onClick={handleSolve} disabled={loading}>
          {loading ? 'جاري الحل...' : 'حل'}
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {ocrLoading && <p>...جارٍ تحليل الصورة</p>}
      </div>

      {answer && <p>النتيجة: {answer}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;