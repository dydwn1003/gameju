// reaper/ 의 게임 파일을 앱용 www/ 폴더로 모은다. (index.html · js · css · fonts + supabase SDK 를 기기 안에 포함)
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), www = path.join(__dirname, 'www');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(path.join(www, 'vendor'), { recursive: true });
for (const d of ['js', 'css', 'fonts']) fs.cpSync(path.join(root, d), path.join(www, d), { recursive: true });
fs.copyFileSync(path.join(root, 'privacy.html'), path.join(www, 'privacy.html'));
fs.copyFileSync(require.resolve('@supabase/supabase-js/dist/umd/supabase.js'), path.join(www, 'vendor', 'supabase.js'));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// 인터넷이 없어도 켜지도록 SDK 를 먼저 불러 둠
html = html.replace('<script src="js/', '<script src="vendor/supabase.js"></script>\n  <script src="js/');
fs.writeFileSync(path.join(www, 'index.html'), html);
console.log('www 준비 완료:', www);
