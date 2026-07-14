import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/variables.css';
import './styles/global.css';
import './styles/animations.css';
import './styles/utilities.css';
import { ThemeProvider } from './hooks/useTheme';
import SEO from './components/SEO/SEO';
import Background from './components/Background/Background';
import Home from './pages/Home/Home';
import JsonFormatter from './pages/JsonFormatter/JsonFormatter';
import DiffChecker from './pages/DiffChecker/DiffChecker';
import JwtDecoder from './pages/JwtDecoder/JwtDecoder';
import Base64 from './pages/Base64/Base64';
import ApiTester from './pages/ApiTester/ApiTester';
import SqlFormatter from './pages/SqlFormatter/SqlFormatter';
import ColorConverter from './pages/ColorConverter/ColorConverter';
import TimestampConverter from './pages/TimestampConverter/TimestampConverter';
import HtmlFormatter from './pages/HtmlFormatter/HtmlFormatter';
import Docs from './pages/Docs/Docs';
import ReviewWidget from './components/ReviewWidget/ReviewWidget';
import MouseGlow from './components/MouseGlow/MouseGlow';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SEO />
        <Background />
        <MouseGlow />
        <ReviewWidget />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools/json-formatter" element={<JsonFormatter />} />
          <Route path="/tools/diff-checker" element={<DiffChecker />} />
          <Route path="/tools/jwt-decoder" element={<JwtDecoder />} />
          <Route path="/tools/base64" element={<Base64 />} />
          <Route path="/tools/api-tester" element={<ApiTester />} />
          <Route path="/tools/sql-formatter" element={<SqlFormatter />} />
          <Route path="/tools/color-converter" element={<ColorConverter />} />
          <Route path="/tools/timestamp-converter" element={<TimestampConverter />} />
          <Route path="/tools/html-formatter" element={<HtmlFormatter />} />
          <Route path="/docs" element={<Docs />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
