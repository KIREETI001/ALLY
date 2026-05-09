// Lightweight in-file i18n. Translates UI strings used across screens.
// Not a full i18n framework — just enough to switch the prototype between
// the five supported languages without pulling in a dependency.
//
// To add a new string: add it to STRINGS with all five language values.
// To use in a component: const t = useT(); t('home.greeting')

import { LangCode } from './types';

type StringKey =
  | 'common.continue' | 'common.back' | 'common.next' | 'common.skip' | 'common.confirm'
  | 'common.signin' | 'common.signup' | 'common.signout' | 'common.cancel' | 'common.save'
  | 'login.welcomeBack' | 'login.createAccount' | 'login.email' | 'login.password' | 'login.name'
  | 'login.subtitle' | 'login.subtitleNew' | 'login.haveAccount' | 'login.noAccount'
  | 'lang.title' | 'onboard.step1Title' | 'onboard.step2Title' | 'onboard.step3Title'
  | 'onboard.yourName' | 'onboard.relationship' | 'onboard.patientName' | 'onboard.age' | 'onboard.conditions' | 'onboard.careKind'
  | 'discharge.title' | 'discharge.subtitle' | 'discharge.paste' | 'discharge.placeholder' | 'discharge.demo' | 'discharge.parse' | 'discharge.skip' | 'discharge.disclaimer'
  | 'parsing.title' | 'parsing.subtitle' | 'confirm.title' | 'confirm.subtitle' | 'confirm.diagnosis' | 'confirm.medications' | 'confirm.tasks' | 'confirm.activate'
  | 'home.goodMorning' | 'home.todayProgress' | 'home.todayTasks' | 'home.seeAll' | 'home.subsidyHook' | 'home.burnoutLow' | 'home.burnoutMod' | 'home.burnoutHigh'
  | 'home.moodPrompt' | 'home.moodSubmit'
  | 'tasks.title' | 'tasks.markComplete' | 'tasks.markIncomplete' | 'tasks.steps' | 'tasks.notes'
  | 'chat.title' | 'chat.subtitle' | 'chat.placeholder' | 'chat.intro'
  | 'res.title' | 'res.subtitle' | 'res.verified'
  | 'profile.title' | 'profile.language' | 'profile.fdwMode' | 'profile.fdwModeDesc' | 'profile.team'
  | 'subsidy.title' | 'subsidy.eligible' | 'subsidy.active' | 'subsidy.check'
  | 'team.title' | 'team.invite' | 'team.inviteBtn' | 'team.inviteEmail' | 'team.inviteRole' | 'team.inviteSent' | 'team.members' | 'team.empty'
  | 'fdw.welcome' | 'fdw.tapToHear';

type Dict = Record<StringKey, string>;

const en: Dict = {
  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.skip': 'Skip',
  'common.confirm': 'Confirm',
  'common.signin': 'Sign In',
  'common.signup': 'Sign Up',
  'common.signout': 'Log Out',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'login.welcomeBack': 'Welcome Back',
  'login.createAccount': 'Create Account',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.name': 'Your Name',
  'login.subtitle': 'Sign in to continue',
  'login.subtitleNew': 'Join Singapore caregivers',
  'login.haveAccount': 'Already have an account?',
  'login.noAccount': "Don't have an account?",
  'lang.title': 'Select Your Language',
  'onboard.step1Title': 'Tell us about you',
  'onboard.step2Title': 'About your loved one',
  'onboard.step3Title': 'Care situation',
  'onboard.yourName': 'Your full name',
  'onboard.relationship': 'Your relationship',
  'onboard.patientName': 'Patient name',
  'onboard.age': 'Age',
  'onboard.conditions': 'Conditions (optional)',
  'onboard.careKind': 'What kind of care?',
  'discharge.title': 'Upload Discharge Summary',
  'discharge.subtitle': 'AI will parse it into a daily care plan',
  'discharge.paste': 'Paste discharge text',
  'discharge.placeholder': 'Paste your hospital discharge summary…',
  'discharge.demo': 'Use Demo SGH Document',
  'discharge.parse': 'Parse with AI →',
  'discharge.skip': 'Skip — set up manually later',
  'discharge.disclaimer': 'You confirm every AI-parsed instruction before activation.',
  'parsing.title': 'Parsing your document…',
  'parsing.subtitle': 'Claude AI is reading the discharge summary',
  'confirm.title': 'Review Your Care Plan',
  'confirm.subtitle': 'Confirm to activate',
  'confirm.diagnosis': 'Diagnosis',
  'confirm.medications': 'Medications',
  'confirm.tasks': 'Tasks',
  'confirm.activate': 'Activate Care Plan ✓',
  'home.goodMorning': 'Good morning,',
  'home.todayProgress': "Today's Progress",
  'home.todayTasks': "Today's Tasks",
  'home.seeAll': 'See all →',
  'home.subsidyHook': 'unclaimed in subsidies',
  'home.burnoutLow': 'You\'re holding up',
  'home.burnoutMod': 'Take care of yourself',
  'home.burnoutHigh': 'You may be burning out',
  'home.moodPrompt': 'How are you feeling today?',
  'home.moodSubmit': 'Log mood',
  'tasks.title': "Today's Tasks",
  'tasks.markComplete': 'Mark Complete ✓',
  'tasks.markIncomplete': 'Mark Incomplete',
  'tasks.steps': 'Steps',
  'tasks.notes': 'Special Notes',
  'chat.title': 'Ally AI',
  'chat.subtitle': 'Medical · Burnout · Financial',
  'chat.placeholder': 'Ask Ally anything…',
  'chat.intro': "Hi 👋 I'm Ally. Ask me anything about caregiving, Singapore subsidies, or how you're coping.",
  'res.title': 'Resource Hub',
  'res.subtitle': 'Clinically verified · 5 languages',
  'res.verified': '✓ Clinically verified',
  'profile.title': 'My Profile',
  'profile.language': 'Language',
  'profile.fdwMode': 'FDW simplified mode',
  'profile.fdwModeDesc': 'Larger text, audio cues, bilingual UI for caregivers and helpers',
  'profile.team': 'Care team',
  'subsidy.title': 'Subsidy Navigator',
  'subsidy.eligible': 'Eligible',
  'subsidy.active': 'Active',
  'subsidy.check': 'Check',
  'team.title': 'Care team',
  'team.invite': 'Invite a family member or helper',
  'team.inviteBtn': 'Send invite',
  'team.inviteEmail': 'Their email',
  'team.inviteRole': 'Role',
  'team.inviteSent': 'Invite sent ✓',
  'team.members': 'Members',
  'team.empty': "You're caring alone right now. Invite someone to share the load.",
  'fdw.welcome': 'Welcome — you are not alone',
  'fdw.tapToHear': 'Tap to hear instructions',
};

// Mandarin
const zh: Dict = {
  ...en,
  'common.continue': '继续', 'common.back': '返回', 'common.next': '下一步', 'common.skip': '跳过', 'common.confirm': '确认',
  'common.signin': '登录', 'common.signup': '注册', 'common.signout': '退出', 'common.cancel': '取消', 'common.save': '保存',
  'login.welcomeBack': '欢迎回来', 'login.createAccount': '创建账户',
  'login.email': '邮箱', 'login.password': '密码', 'login.name': '您的姓名',
  'login.subtitle': '登录以继续', 'login.subtitleNew': '加入新加坡的看护者',
  'login.haveAccount': '已有账户？', 'login.noAccount': '还没有账户？',
  'lang.title': '选择您的语言',
  'onboard.step1Title': '告诉我们您的信息', 'onboard.step2Title': '关于您的家人', 'onboard.step3Title': '看护情况',
  'onboard.yourName': '您的全名', 'onboard.relationship': '您的关系', 'onboard.patientName': '病人姓名', 'onboard.age': '年龄', 'onboard.conditions': '病况（可选）', 'onboard.careKind': '什么样的看护？',
  'discharge.title': '上传出院摘要', 'discharge.subtitle': 'AI 将转换为每日护理计划',
  'discharge.paste': '粘贴出院文字', 'discharge.placeholder': '请粘贴您的医院出院摘要……',
  'discharge.demo': '使用示例文档', 'discharge.parse': '用 AI 解析 →', 'discharge.skip': '跳过 — 之后手动设置',
  'discharge.disclaimer': '您将在激活前确认每条 AI 解析的指示。',
  'parsing.title': '正在解析您的文档……', 'parsing.subtitle': 'Claude AI 正在阅读出院摘要',
  'confirm.title': '审核您的护理计划', 'confirm.subtitle': '确认以激活',
  'confirm.diagnosis': '诊断', 'confirm.medications': '药物', 'confirm.tasks': '任务', 'confirm.activate': '激活护理计划 ✓',
  'home.goodMorning': '早上好，', 'home.todayProgress': '今日进度', 'home.todayTasks': '今日任务', 'home.seeAll': '查看全部 →',
  'home.subsidyHook': '未申请补助',
  'home.burnoutLow': '您坚持得很好', 'home.burnoutMod': '请照顾好自己', 'home.burnoutHigh': '您可能正在过度劳累',
  'home.moodPrompt': '您今天感觉如何？', 'home.moodSubmit': '记录心情',
  'tasks.title': '今日任务', 'tasks.markComplete': '标记完成 ✓', 'tasks.markIncomplete': '标记未完成',
  'tasks.steps': '步骤', 'tasks.notes': '特别说明',
  'chat.title': 'Ally 智能助手', 'chat.subtitle': '医疗 · 倦怠 · 财务', 'chat.placeholder': '问 Ally 任何问题……',
  'chat.intro': '您好 👋 我是 Ally。可以询问关于看护、新加坡补助或您的状态的任何问题。',
  'res.title': '资源中心', 'res.subtitle': '临床验证 · 五种语言', 'res.verified': '✓ 临床验证',
  'profile.title': '我的资料', 'profile.language': '语言', 'profile.fdwMode': '家务工人简化模式',
  'profile.fdwModeDesc': '更大字体、语音提示、双语界面',
  'profile.team': '护理团队',
  'subsidy.title': '补助导航', 'subsidy.eligible': '符合资格', 'subsidy.active': '已申请', 'subsidy.check': '查看',
  'team.title': '护理团队', 'team.invite': '邀请家人或帮手',
  'team.inviteBtn': '发送邀请', 'team.inviteEmail': '他们的邮箱', 'team.inviteRole': '角色',
  'team.inviteSent': '邀请已发送 ✓', 'team.members': '成员', 'team.empty': '您目前独自照顾。邀请其他人一起分担。',
  'fdw.welcome': '欢迎 — 您并不孤单', 'fdw.tapToHear': '点击聆听指示',
};

// Malay (Bahasa Melayu)
const ms: Dict = {
  ...en,
  'common.continue': 'Teruskan', 'common.back': 'Kembali', 'common.next': 'Seterusnya', 'common.skip': 'Langkau', 'common.confirm': 'Sahkan',
  'common.signin': 'Log Masuk', 'common.signup': 'Daftar', 'common.signout': 'Log Keluar', 'common.cancel': 'Batal', 'common.save': 'Simpan',
  'login.welcomeBack': 'Selamat Kembali', 'login.createAccount': 'Cipta Akaun',
  'login.email': 'E-mel', 'login.password': 'Kata Laluan', 'login.name': 'Nama Anda',
  'login.subtitle': 'Log masuk untuk teruskan', 'login.subtitleNew': 'Sertai penjaga Singapura',
  'login.haveAccount': 'Sudah ada akaun?', 'login.noAccount': 'Belum ada akaun?',
  'lang.title': 'Pilih Bahasa Anda',
  'onboard.step1Title': 'Tentang anda', 'onboard.step2Title': 'Tentang keluarga anda', 'onboard.step3Title': 'Situasi penjagaan',
  'onboard.yourName': 'Nama penuh', 'onboard.relationship': 'Hubungan anda', 'onboard.patientName': 'Nama pesakit', 'onboard.age': 'Umur', 'onboard.conditions': 'Keadaan kesihatan (pilihan)', 'onboard.careKind': 'Apakah jenis penjagaan?',
  'discharge.title': 'Muat Naik Ringkasan Pulang', 'discharge.subtitle': 'AI akan menyusun ke pelan harian',
  'discharge.paste': 'Tampal teks ringkasan', 'discharge.placeholder': 'Tampal ringkasan pulang hospital anda…',
  'discharge.demo': 'Guna Dokumen Contoh', 'discharge.parse': 'Hurai dengan AI →', 'discharge.skip': 'Langkau — sediakan manual kemudian',
  'discharge.disclaimer': 'Anda mengesahkan setiap arahan sebelum diaktifkan.',
  'parsing.title': 'Sedang menghurai dokumen…', 'parsing.subtitle': 'Claude AI sedang membaca ringkasan',
  'confirm.title': 'Semak Pelan Penjagaan', 'confirm.subtitle': 'Sahkan untuk aktifkan',
  'confirm.diagnosis': 'Diagnosis', 'confirm.medications': 'Ubat-ubatan', 'confirm.tasks': 'Tugas', 'confirm.activate': 'Aktifkan Pelan ✓',
  'home.goodMorning': 'Selamat pagi,', 'home.todayProgress': 'Kemajuan Hari Ini', 'home.todayTasks': 'Tugas Hari Ini', 'home.seeAll': 'Lihat semua →',
  'home.subsidyHook': 'belum dituntut',
  'home.burnoutLow': 'Anda berusaha dengan baik', 'home.burnoutMod': 'Jaga diri anda', 'home.burnoutHigh': 'Anda mungkin keletihan',
  'home.moodPrompt': 'Bagaimana perasaan anda hari ini?', 'home.moodSubmit': 'Rekod mood',
  'tasks.title': 'Tugas Hari Ini', 'tasks.markComplete': 'Tandakan Selesai ✓', 'tasks.markIncomplete': 'Tandakan Belum Selesai',
  'tasks.steps': 'Langkah', 'tasks.notes': 'Nota Khas',
  'chat.title': 'Ally AI', 'chat.subtitle': 'Perubatan · Keletihan · Kewangan', 'chat.placeholder': 'Tanya Ally apa sahaja…',
  'chat.intro': 'Hai 👋 Saya Ally. Tanya saya tentang penjagaan, subsidi Singapura atau keadaan anda.',
  'res.title': 'Pusat Sumber', 'res.subtitle': 'Disahkan klinikal · 5 bahasa', 'res.verified': '✓ Disahkan klinikal',
  'profile.title': 'Profil Saya', 'profile.language': 'Bahasa', 'profile.fdwMode': 'Mod ringkas FDW',
  'profile.fdwModeDesc': 'Teks lebih besar, isyarat audio, antara muka dwibahasa',
  'profile.team': 'Pasukan penjagaan',
  'subsidy.title': 'Pelayar Subsidi', 'subsidy.eligible': 'Layak', 'subsidy.active': 'Aktif', 'subsidy.check': 'Semak',
  'team.title': 'Pasukan penjagaan', 'team.invite': 'Jemput ahli keluarga atau pembantu',
  'team.inviteBtn': 'Hantar jemputan', 'team.inviteEmail': 'E-mel mereka', 'team.inviteRole': 'Peranan',
  'team.inviteSent': 'Jemputan dihantar ✓', 'team.members': 'Ahli', 'team.empty': 'Anda menjaga seorang diri. Jemput orang lain untuk berkongsi beban.',
  'fdw.welcome': 'Selamat datang — anda tidak keseorangan', 'fdw.tapToHear': 'Ketuk untuk dengar arahan',
};

// Tamil
const ta: Dict = {
  ...en,
  'common.continue': 'தொடரவும்', 'common.back': 'பின்', 'common.next': 'அடுத்து', 'common.skip': 'தவிர்க்க', 'common.confirm': 'உறுதிசெய்',
  'common.signin': 'உள்நுழை', 'common.signup': 'பதிவு', 'common.signout': 'வெளியேறு', 'common.cancel': 'ரத்து', 'common.save': 'சேமி',
  'login.welcomeBack': 'மீண்டும் வரவேற்கிறோம்', 'login.createAccount': 'கணக்கை உருவாக்கு',
  'login.email': 'மின்னஞ்சல்', 'login.password': 'கடவுச்சொல்', 'login.name': 'உங்கள் பெயர்',
  'login.subtitle': 'தொடர உள்நுழையவும்', 'login.subtitleNew': 'சிங்கப்பூர் பராமரிப்பாளர்களுடன் சேருங்கள்',
  'login.haveAccount': 'ஏற்கனவே கணக்கு உள்ளதா?', 'login.noAccount': 'கணக்கு இல்லையா?',
  'lang.title': 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
  'onboard.step1Title': 'உங்களைப் பற்றி', 'onboard.step2Title': 'உங்கள் அன்பானவரைப் பற்றி', 'onboard.step3Title': 'பராமரிப்பு நிலை',
  'onboard.yourName': 'முழுப் பெயர்', 'onboard.relationship': 'உறவு', 'onboard.patientName': 'நோயாளியின் பெயர்', 'onboard.age': 'வயது', 'onboard.conditions': 'நிலைகள் (விருப்பமானது)', 'onboard.careKind': 'எந்த வகை பராமரிப்பு?',
  'discharge.title': 'வெளியீட்டுச் சுருக்கத்தைப் பதிவேற்று', 'discharge.subtitle': 'AI இதை தினசரி பராமரிப்பு திட்டமாக மாற்றும்',
  'discharge.paste': 'வெளியீட்டுச் சுருக்கத்தை ஒட்டு', 'discharge.placeholder': 'மருத்துவமனை சுருக்கத்தை ஒட்டவும்…',
  'discharge.demo': 'மாதிரி ஆவணத்தைப் பயன்படுத்து', 'discharge.parse': 'AI மூலம் பகுப்பாய்வு →', 'discharge.skip': 'தவிர்த்து — கைமுறையாக அமை',
  'discharge.disclaimer': 'நீங்கள் ஒவ்வொரு வழிமுறையையும் உறுதிப்படுத்துகிறீர்கள்.',
  'parsing.title': 'ஆவணத்தைப் பகுப்பாய்வு செய்கிறது…', 'parsing.subtitle': 'Claude AI வாசிக்கிறது',
  'confirm.title': 'உங்கள் திட்டத்தைப் பாருங்கள்', 'confirm.subtitle': 'செயல்படுத்த உறுதிசெய்',
  'confirm.diagnosis': 'நோயறிதல்', 'confirm.medications': 'மருந்துகள்', 'confirm.tasks': 'பணிகள்', 'confirm.activate': 'திட்டத்தை செயல்படுத்து ✓',
  'home.goodMorning': 'காலை வணக்கம்,', 'home.todayProgress': 'இன்றைய முன்னேற்றம்', 'home.todayTasks': 'இன்றைய பணிகள்', 'home.seeAll': 'அனைத்தையும் பார் →',
  'home.subsidyHook': 'கோரப்படாத மானியம்',
  'home.burnoutLow': 'நீங்கள் நன்றாக நிர்வகிக்கிறீர்கள்', 'home.burnoutMod': 'உங்களைப் பற்றி கவனியுங்கள்', 'home.burnoutHigh': 'நீங்கள் சோர்வடைகிறீர்கள்',
  'home.moodPrompt': 'இன்று எப்படி உணர்கிறீர்கள்?', 'home.moodSubmit': 'மனநிலை பதிவு',
  'tasks.title': 'இன்றைய பணிகள்', 'tasks.markComplete': 'முடிந்தது ✓', 'tasks.markIncomplete': 'முடிக்கப்படவில்லை',
  'tasks.steps': 'படிகள்', 'tasks.notes': 'குறிப்புகள்',
  'chat.title': 'Ally AI', 'chat.subtitle': 'மருத்துவம் · சோர்வு · நிதி', 'chat.placeholder': 'Ally-யிடம் கேள்…',
  'chat.intro': 'வணக்கம் 👋 நான் Ally. பராமரிப்பு, மானியங்கள் அல்லது உங்கள் நிலையைப் பற்றி கேள்விகள்.',
  'res.title': 'வளக் களஞ்சியம்', 'res.subtitle': 'மருத்துவ சரிபார்ப்பு · 5 மொழிகள்', 'res.verified': '✓ சரிபார்க்கப்பட்டது',
  'profile.title': 'என் சுயவிவரம்', 'profile.language': 'மொழி', 'profile.fdwMode': 'FDW எளிய பயன்முறை',
  'profile.fdwModeDesc': 'பெரிய எழுத்துரு, ஒலி குறிப்புகள், இரு மொழி',
  'profile.team': 'பராமரிப்புக் குழு',
  'subsidy.title': 'மானிய வழிகாட்டி', 'subsidy.eligible': 'தகுதி', 'subsidy.active': 'செயலில்', 'subsidy.check': 'சரிபார்',
  'team.title': 'பராமரிப்புக் குழு', 'team.invite': 'குடும்ப உறுப்பினர் அல்லது உதவியாளரை அழைக்கவும்',
  'team.inviteBtn': 'அழைப்பை அனுப்பு', 'team.inviteEmail': 'அவர்களின் மின்னஞ்சல்', 'team.inviteRole': 'பங்கு',
  'team.inviteSent': 'அழைப்பு அனுப்பப்பட்டது ✓', 'team.members': 'உறுப்பினர்கள்', 'team.empty': 'நீங்கள் தனியாக பராமரிக்கிறீர்கள். பகிர்ந்துகொள்ள மற்றொருவரை அழைக்கவும்.',
  'fdw.welcome': 'வரவேற்கிறோம் — நீங்கள் தனியாக இல்லை', 'fdw.tapToHear': 'வழிமுறைகளைக் கேட்க தட்டவும்',
};

// Filipino (Tagalog)
const ph: Dict = {
  ...en,
  'common.continue': 'Magpatuloy', 'common.back': 'Bumalik', 'common.next': 'Susunod', 'common.skip': 'Laktawan', 'common.confirm': 'Kumpirmahin',
  'common.signin': 'Mag-sign In', 'common.signup': 'Mag-sign Up', 'common.signout': 'Mag-log Out', 'common.cancel': 'Kanselahin', 'common.save': 'I-save',
  'login.welcomeBack': 'Maligayang Pagbabalik', 'login.createAccount': 'Gumawa ng Account',
  'login.email': 'Email', 'login.password': 'Password', 'login.name': 'Iyong Pangalan',
  'login.subtitle': 'Mag-sign in para magpatuloy', 'login.subtitleNew': 'Sumama sa mga caregiver sa Singapore',
  'login.haveAccount': 'May account na?', 'login.noAccount': 'Wala pang account?',
  'lang.title': 'Piliin ang Iyong Wika',
  'onboard.step1Title': 'Tungkol sa iyo', 'onboard.step2Title': 'Tungkol sa iyong mahal sa buhay', 'onboard.step3Title': 'Sitwasyon ng pag-aalaga',
  'onboard.yourName': 'Buong pangalan', 'onboard.relationship': 'Iyong relasyon', 'onboard.patientName': 'Pangalan ng pasyente', 'onboard.age': 'Edad', 'onboard.conditions': 'Mga kondisyon (opsyonal)', 'onboard.careKind': 'Anong klaseng pag-aalaga?',
  'discharge.title': 'I-upload ang Discharge Summary', 'discharge.subtitle': 'Gagawing pang-araw-araw na plano ng AI',
  'discharge.paste': 'I-paste ang teksto', 'discharge.placeholder': 'I-paste ang summary ng hospital…',
  'discharge.demo': 'Gamitin ang Demo Document', 'discharge.parse': 'I-parse gamit ang AI →', 'discharge.skip': 'Laktawan — manu-manong i-set up',
  'discharge.disclaimer': 'Kumpirmado mo ang bawat tagubilin bago i-activate.',
  'parsing.title': 'Pina-parse ang dokumento…', 'parsing.subtitle': 'Binabasa ng Claude AI ang summary',
  'confirm.title': 'I-review ang Plano ng Pag-aalaga', 'confirm.subtitle': 'Kumpirmahin para i-activate',
  'confirm.diagnosis': 'Diagnosis', 'confirm.medications': 'Mga Gamot', 'confirm.tasks': 'Mga Gawain', 'confirm.activate': 'I-activate ang Plano ✓',
  'home.goodMorning': 'Magandang umaga,', 'home.todayProgress': 'Progreso Ngayon', 'home.todayTasks': 'Mga Gawain Ngayon', 'home.seeAll': 'Tingnan lahat →',
  'home.subsidyHook': 'hindi pa naaangkin',
  'home.burnoutLow': 'Maayos ka', 'home.burnoutMod': 'Alagaan mo ang sarili mo', 'home.burnoutHigh': 'Maaaring napapagod ka na',
  'home.moodPrompt': 'Kumusta ka ngayon?', 'home.moodSubmit': 'Mag-log ng mood',
  'tasks.title': 'Mga Gawain Ngayon', 'tasks.markComplete': 'Markahang Tapos ✓', 'tasks.markIncomplete': 'Markahang Hindi Tapos',
  'tasks.steps': 'Mga Hakbang', 'tasks.notes': 'Mga Espesyal na Tala',
  'chat.title': 'Ally AI', 'chat.subtitle': 'Medikal · Pagkapagod · Pinansyal', 'chat.placeholder': 'Magtanong kay Ally…',
  'chat.intro': 'Kumusta 👋 Ako si Ally. Magtanong tungkol sa pag-aalaga, mga subsidy ng Singapore, o kung kumusta ka.',
  'res.title': 'Resource Hub', 'res.subtitle': 'Klinikal na verified · 5 wika', 'res.verified': '✓ Klinikal na verified',
  'profile.title': 'Aking Profile', 'profile.language': 'Wika', 'profile.fdwMode': 'FDW simplified mode',
  'profile.fdwModeDesc': 'Mas malaking text, audio cues, dalawang wika',
  'profile.team': 'Care team',
  'subsidy.title': 'Subsidy Navigator', 'subsidy.eligible': 'Karapat-dapat', 'subsidy.active': 'Aktibo', 'subsidy.check': 'Suriin',
  'team.title': 'Care team', 'team.invite': 'Mag-imbita ng pamilya o helper',
  'team.inviteBtn': 'Magpadala ng imbita', 'team.inviteEmail': 'Kanilang email', 'team.inviteRole': 'Tungkulin',
  'team.inviteSent': 'Imbita ipinadala ✓', 'team.members': 'Mga miyembro', 'team.empty': 'Mag-isa ka ngayong nag-aalaga. Mag-imbita para magbahagi ng pasanin.',
  'fdw.welcome': 'Maligayang pagdating — hindi ka nag-iisa', 'fdw.tapToHear': 'Pindutin para marinig',
};

const DICTS: Record<LangCode, Dict> = { en, zh, ms, ta, ph };

export function translate(key: StringKey, lang: LangCode = 'en'): string {
  return DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
}

// Convenience React hook used by components.
import { useApp } from '@/context/AppContext';

export function useT() {
  const { lang } = useApp();
  return (key: StringKey) => translate(key, lang);
}
