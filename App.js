import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Switch,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const envError = (!supabaseUrl || !supabaseAnonKey)
  ? '⚠️ แอปยังอ่านไฟล์ .env ไม่เจอ (เช็กชื่อไฟล์ .env และรีสตาร์ตเซิร์ฟเวอร์ด้วย npx expo start --web -c)'
  : '';

const supabase = createClient(
  'https://lueauyfurtszayvfcebd.supabase.co',
  'sb_publishable_eETcQA-JPuwP0Yz7qdITiw_9egMHxcz'
);

const COLORS = {
  bg: '#FFFFFF',
  card: '#FAFAFC',
  border: '#F0EEF6',
  textDark: '#333042',
  textMuted: '#7E7A90',
  pink: '#FFB7C5',
  pinkLight: '#FFF0F3',
  purple: '#C5B4E3',
  purpleLight: '#F4F0FA',
  blue: '#A8D8EA',
  blueLight: '#EFF8FC',
  green: '#B5EAD7',
  greenLight: '#EFFAF5',
  yellow: '#FFEAA7',
  yellowLight: '#FFFDF0',
  danger: '#FF8A8A',
  dangerBg: '#FFF0F0',
};

export default function App() {
  const [screen, setScreen] = useState('Splash');
  const [activeTab, setActiveTab] = useState('Home');
  const [session, setSession] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('วิทยาการคอมพิวเตอร์');
  const [secCode, setSecCode] = useState('Sec 02');
  const [wakePoints, setWakePoints] = useState(0);

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('ส่วนตัว');
  const [newTaskDate, setNewTaskDate] = useState('18 พ.ค. 2026');
  const [newTaskTime, setNewTaskTime] = useState('16:00 น.');
  const [newTaskNote, setNewTaskNote] = useState('');

  const [currentGroup, setCurrentGroup] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const [secPosts, setSecPosts] = useState([]);
  const [newSecTitle, setNewSecTitle] = useState('');
  const [urgentMsg, setUrgentMsg] = useState('อาจารย์เช็กชื่อด่วน! รีบเข้าห้องเรียนเลยทุกคน');

  const [wakeLogs, setWakeLogs] = useState([]);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const goTo = (targetScreen, tabName = null) => {
    setErrorMsg('');
    setScreen(targetScreen);
    if (tabName) setActiveTab(tabName);
  };

  useEffect(() => {
    if (envError) return;
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      if (activeSession) {
        setSession(activeSession);
        loadAllUserData(activeSession.user.id);
        goTo('Home', 'Home');
      }
    });
  }, []);

  const loadAllUserData = async (userId) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof) {
        setFullName(prof.full_name || 'นักศึกษา');
        setStudentId(prof.student_id || '');
        setFaculty(prof.faculty || 'วิทยาการคอมพิวเตอร์');
        setSecCode(prof.sec_code || 'Sec 02');
        setWakePoints(prof.wake_points || 0);
      }

      const { data: taskData, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (taskErr) throw taskErr;
      setTasks(taskData || []);

      const { data: secData } = await supabase
        .from('sec_posts')
        .select('*')
        .order('created_at', { ascending: false });
      setSecPosts(secData || []);

      const { data: logsData } = await supabase
        .from('wake_logs')
        .select('*')
        .order('created_at', { ascending: false });
      setWakeLogs(logsData || []);
    } catch (err) {
      setErrorMsg('โหลดข้อมูลไม่สำเร็จ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (envError) {
      setErrorMsg(envError);
      return;
    }
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบถ้วน');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) {
        setErrorMsg('Supabase แจ้งเตือน: ' + error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { error: profErr } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          student_id: studentId.trim(),
          sec_code: secCode.trim() || 'Sec 02',
          wake_points: 0,
        });
        if (profErr) {
          setErrorMsg('บันทึกโปรไฟล์ไม่สำเร็จ: ' + profErr.message);
          setLoading(false);
          return;
        }
        setSession(data.session);
        await loadAllUserData(data.user.id);
        goTo('Home', 'Home');
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาด: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (envError) {
      setErrorMsg(envError);
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) {
        setErrorMsg('เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
        setLoading(false);
        return;
      }

      setSession(data.session);
      await loadAllUserData(data.user.id);
      goTo('Home', 'Home');
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาด: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setTasks([]);
    setCurrentGroup(null);
    goTo('Splash');
  };

  const ErrorBanner = () =>
    (errorMsg || envError) ? (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>⚠️ {errorMsg || envError}</Text>
      </View>
    ) : null;

  const Header = ({ title, backTo, rightText, onRightPress, bg = COLORS.bg }) => (
    <View style={[styles.header, { backgroundColor: bg }]}>
      {backTo ? (
        <TouchableOpacity onPress={() => goTo(backTo)} style={styles.backBtn}>
          <Text style={styles.backText}>{'< กลับ'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 50 }} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {rightText ? (
        <TouchableOpacity onPress={onRightPress}>
          <Text style={styles.rightHeaderText}>{rightText}</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 50 }} />
      )}
    </View>
  );

  const BottomBar = () => (
    <View style={styles.bottomBar}>
      {[
        { key: 'Home', label: 'หน้าหลัก', icon: '🏠', target: 'Home' },
        { key: 'Tasks', label: 'งานของฉัน', icon: '📝', target: 'MyTasks' },
        { key: 'Group', label: 'กลุ่ม', icon: '👥', target: currentGroup ? 'GroupDetail' : 'JoinGroup' },
        { key: 'Profile', label: 'โปรไฟล์', icon: '👤', target: 'Profile' },
      ].map((item) => {
        const active = activeTab === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.tabItem, active && { backgroundColor: COLORS.purpleLight }]}
            onPress={() => goTo(item.target, item.key)}
          >
            <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            <Text style={[styles.tabLabel, active && { color: '#6B4EFF', fontWeight: '700' }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (screen === 'Splash') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.pinkLight }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerBox}>
          <View style={styles.logoCircle}>
            <Text style={{ fontSize: 44 }}>🌸</Text>
          </View>
          <Text style={styles.brandTitle}>Luem-Mai-Dai</Text>
          <Text style={styles.brandSub}>(ลืมไม่ได้)</Text>
          <Text style={styles.brandDesc}>
            ผู้ช่วยเตือนความจำ ตารางเรียน และงานกลุ่ม{'\n'}เชื่อมต่อฐานข้อมูลจริงผ่าน Supabase
          </Text>

          <ErrorBanner />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.purple }]}
            onPress={() => goTo('Login')}
          >
            <Text style={styles.primaryBtnText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: COLORS.purple }]}
            onPress={() => goTo('Register')}
          >
            <Text style={[styles.outlineBtnText, { color: '#6B4EFF' }]}>สมัครสมาชิกใหม่</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'Login') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="เข้าสู่ระบบ" backTo="Splash" />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.pastelBanner, { backgroundColor: COLORS.blueLight }]}>
            <Text style={styles.bannerTitle}>ยินดีต้อนรับกลับมา! 👋</Text>
            <Text style={styles.bannerSub}>เข้าสู่ระบบด้วยบัญชี Supabase ของคุณ</Text>
          </View>

          <ErrorBanner />

          <Text style={styles.label}>อีเมลนักศึกษา</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น 66010999@uni.ac.th"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>รหัสผ่าน</Text>
          <TextInput
            style={styles.input}
            placeholder="กรอกรหัสผ่าน"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.pink, marginTop: 20 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textDark} />
            ) : (
              <Text style={styles.primaryBtnText}>เข้าสู่ระบบ</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => goTo('Register')} style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ color: COLORS.textMuted }}>
              ยังไม่มีบัญชีใช่ไหม? <Text style={{ color: '#6B4EFF', fontWeight: '700' }}>สมัครสมาชิก</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'Register') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="สมัครสมาชิก" backTo="Splash" />
        <ScrollView contentContainerStyle={styles.pad}>
          <ErrorBanner />

          <Text style={styles.label}>ชื่อ - นามสกุล *</Text>
          <TextInput style={styles.input} placeholder="เช่น รติภรณ์ ใจดี" value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>รหัสนักศึกษา</Text>
          <TextInput style={styles.input} placeholder="เช่น 66010999" value={studentId} onChangeText={setStudentId} />

          <Text style={styles.label}>อีเมล *</Text>
          <TextInput
            style={styles.input}
            placeholder="student@uni.ac.th"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>รหัสผ่าน (6 ตัวอักษรขึ้นไป) *</Text>
          <TextInput
            style={styles.input}
            placeholder="ตั้งรหัสผ่าน"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Sec เรียน</Text>
          <TextInput style={styles.input} placeholder="เช่น Sec 02" value={secCode} onChangeText={setSecCode} />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.green, marginTop: 20 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textDark} />
            ) : (
              <Text style={styles.primaryBtnText}>สมัครสมาชิกและเข้าใช้งาน</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'Home') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.greetingText}>สวัสดี, {fullName || 'นักศึกษา'} 👋</Text>
              <Text style={styles.subGreeting}>{secCode} • แต้มตื่นเช้า {wakePoints} คะแนน</Text>
            </View>
            <TouchableOpacity
              style={[styles.iconBadge, { backgroundColor: COLORS.yellowLight }]}
              onPress={() => goTo('Notifications')}
            >
              <Text style={{ fontSize: 20 }}>🔔</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.quickGrid, { marginTop: 16 }]}>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: COLORS.pinkLight }]} onPress={() => goTo('CreateTask')}>
              <Text style={styles.quickIcon}>➕</Text>
              <Text style={styles.quickText}>สร้างงานใหม่</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: COLORS.blueLight }]} onPress={() => goTo('JoinGroup')}>
              <Text style={styles.quickIcon}>🤝</Text>
              <Text style={styles.quickText}>เข้า/สร้างกลุ่ม</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: COLORS.yellowLight }]} onPress={() => goTo('SecAnnouncements')}>
              <Text style={styles.quickIcon}>📢</Text>
              <Text style={styles.quickText}>ประกาศ Sec</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: COLORS.greenLight }]} onPress={() => goTo('WakeUpChallenge')}>
              <Text style={styles.quickIcon}>⏰</Text>
              <Text style={styles.quickText}>Wake-up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.alertStrip, { backgroundColor: COLORS.dangerBg, borderColor: COLORS.danger }]}
            onPress={() => goTo('SecAlert')}
          >
            <Text style={{ fontSize: 18 }}>🚨</Text>
            <Text style={{ fontWeight: '700', color: '#D94848', marginLeft: 8 }}>
              Sec Alert (แจ้งเตือนด่วน / เช็กชื่อฉุกเฉิน)
            </Text>
          </TouchableOpacity>

          <ErrorBanner />

          {loading ? (
            <View style={[styles.emptyBox, { backgroundColor: COLORS.card }]}>
              <ActivityIndicator size="large" color="#6B4EFF" />
              <Text style={{ marginTop: 10, color: COLORS.textMuted }}>กำลังซิงค์ข้อมูลจาก Supabase...</Text>
            </View>
          ) : tasks.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: COLORS.purpleLight }]}>
              <Text style={{ fontSize: 48, marginBottom: 10 }}>🧸</Text>
              <Text style={styles.emptyTitle}>ยังไม่มีรายการงานในตอนนี้</Text>
              <Text style={styles.emptySub}>
                ข้อมูลเชื่อมต่อ Supabase แล้ว กดสร้างงานใหม่เพื่อบันทึกลงฐานข้อมูลจริงได้เลย
              </Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: COLORS.purple, width: '80%' }]}
                onPress={() => goTo('CreateTask')}
              >
                <Text style={styles.primaryBtnText}>+ สร้างงานใหม่แรกของคุณ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>รายการงานของคุณ ({tasks.length})</Text>
                <TouchableOpacity onPress={() => goTo('MyTasks', 'Tasks')}>
                  <Text style={{ color: '#6B4EFF', fontWeight: '600' }}>ดูทั้งหมด</Text>
                </TouchableOpacity>
              </View>

              {tasks.map((t) => {
                const isGroup = t.task_type === 'งานกลุ่ม';
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.taskCard, { backgroundColor: isGroup ? COLORS.pinkLight : COLORS.greenLight }]}
                    onPress={() => {
                      setSelectedTask(t);
                      goTo('TaskDetail');
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{t.title}</Text>
                      <Text style={styles.taskTime}>🕒 {t.due_time}</Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: isGroup ? COLORS.pink : COLORS.green }]}>
                      <Text style={styles.tagText}>{t.task_type}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
        <BottomBar />
      </SafeAreaView>
    );
  }

  if (screen === 'MyTasks') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="รายการงาน (My Tasks)" rightText="+ เพิ่ม" onRightPress={() => goTo('CreateTask')} />
        <ScrollView contentContainerStyle={styles.pad}>
          {tasks.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: COLORS.blueLight, marginTop: 30 }]}>
              <Text style={{ fontSize: 42, marginBottom: 8 }}>📝</Text>
              <Text style={styles.emptyTitle}>รายการงานยังว่างอยู่</Text>
              <Text style={styles.emptySub}>กดปุ่ม "+ เพิ่ม" ด้านบนเพื่อเพิ่มงานลง Supabase</Text>
            </View>
          ) : (
            tasks.map((t) => {
              const isGroup = t.task_type === 'งานกลุ่ม';
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.taskCard, { backgroundColor: isGroup ? COLORS.pinkLight : COLORS.blueLight }]}
                  onPress={() => {
                    setSelectedTask(t);
                    goTo('TaskDetail');
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{t.title}</Text>
                    <Text style={styles.taskTime}>{t.due_time}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: isGroup ? COLORS.pink : COLORS.blue }]}>
                    <Text style={styles.tagText}>{t.task_type}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
        <BottomBar />
      </SafeAreaView>
    );
  }

  if (screen === 'CreateTask') {
    const handleAddTask = async () => {
      if (!newTaskTitle.trim()) {
        setErrorMsg('กรุณากรอกชื่องานก่อนบันทึก');
        return;
      }
      setLoading(true);
      setErrorMsg('');
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: session.user.id,
            group_code: currentGroup ? currentGroup.code : null,
            title: newTaskTitle.trim(),
            task_type: newTaskType,
            due_time: `${newTaskDate} • ${newTaskTime}`,
            note: newTaskNote.trim() || 'ไม่มีรายละเอียดเพิ่มเติม',
          })
          .select()
          .single();

        if (error) throw error;
        setTasks([data, ...tasks]);
        setNewTaskTitle('');
        setNewTaskNote('');
        goTo('Home', 'Home');
      } catch (err) {
        setErrorMsg('บันทึกไม่สำเร็จ: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <Header title="สร้างงานใหม่" backTo="Home" />
        <ScrollView contentContainerStyle={styles.pad}>
          <ErrorBanner />

          <Text style={styles.label}>ชื่องาน / สิ่งที่ต้องทำ *</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น ส่งรายงาน Mobile Programming"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
          />

          <Text style={styles.label}>ประเภทงาน</Text>
          <View style={styles.row}>
            {['ส่วนตัว', 'งานกลุ่ม'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.selectPill,
                  { backgroundColor: newTaskType === type ? COLORS.purple : COLORS.card },
                ]}
                onPress={() => setNewTaskType(type)}
              >
                <Text style={{ fontWeight: '700', color: newTaskType === type ? '#FFF' : COLORS.textDark }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>วันที่และเวลาแจ้งเตือน</Text>
          <View style={styles.rowBetween}>
            <TextInput style={[styles.input, { width: '48%' }]} value={newTaskDate} onChangeText={setNewTaskDate} />
            <TextInput style={[styles.input, { width: '48%' }]} value={newTaskTime} onChangeText={setNewTaskTime} />
          </View>

          <Text style={styles.label}>รายละเอียดเพิ่มเติม</Text>
          <TextInput
            style={[styles.input, { height: 90 }]}
            multiline
            placeholder="จดโน้ตหรือลิงก์ส่งงาน..."
            value={newTaskNote}
            onChangeText={setNewTaskNote}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.green, marginTop: 20 }]}
            onPress={handleAddTask}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={COLORS.textDark} /> : <Text style={styles.primaryBtnText}>บันทึกงานลงฐานข้อมูล</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'TaskDetail' && selectedTask) {
    const handleCompleteTask = async () => {
      setLoading(true);
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', selectedTask.id);
        if (error) throw error;
        setTasks(tasks.filter((item) => item.id !== selectedTask.id));
        Alert.alert('สำเร็จ', 'ส่งงานเรียบร้อย และอัปเดตฐานข้อมูลแล้ว!');
        goTo('Home', 'Home');
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <Header title="รายละเอียดงาน" backTo="Home" />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.pastelBanner, { backgroundColor: COLORS.pinkLight }]}>
            <View style={[styles.tag, { backgroundColor: COLORS.pink, alignSelf: 'flex-start', marginBottom: 8 }]}>
              <Text style={styles.tagText}>{selectedTask.task_type}</Text>
            </View>
            <Text style={styles.bannerTitle}>{selectedTask.title}</Text>
            <Text style={styles.bannerSub}>กำหนดส่ง: {selectedTask.due_time}</Text>
          </View>

          <Text style={styles.label}>รายละเอียด</Text>
          <View style={styles.infoBox}>
            <Text style={{ color: COLORS.textDark, lineHeight: 22 }}>{selectedTask.note}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.green, marginTop: 24 }]}
            onPress={handleCompleteTask}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={COLORS.textDark} /> : <Text style={styles.primaryBtnText}>✅ ทำเครื่องหมายว่าเสร็จแล้ว</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'JoinGroup') {
    const handleJoinGroup = async () => {
      if (!joinCodeInput.trim()) return setErrorMsg('กรุณากรอกรหัสกลุ่ม 6 หลัก');
      setLoading(true);
      setErrorMsg('');
      try {
        const { data, error } = await supabase
          .from('study_groups')
          .select('*')
          .eq('code', joinCodeInput.trim())
          .single();
        if (error || !data) throw new Error('ไม่พบรหัสกลุ่มนี้ในระบบ ลองสร้างกลุ่มใหม่ดูนะ');
        setCurrentGroup(data);
        loadGroupMessages(data.code);
        goTo('GroupDetail', 'Group');
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    const handleCreateGroup = async () => {
      if (!newGroupName.trim()) return setErrorMsg('กรุณาตั้งชื่อกลุ่มก่อน');
      setLoading(true);
      setErrorMsg('');
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        const { data, error } = await supabase
          .from('study_groups')
          .insert({
            code: randomCode,
            name: newGroupName.trim(),
            subject: newGroupSubject.trim() || 'DX212 Mobile Programming',
            created_by: session.user.id,
          })
          .select()
          .single();
        if (error) throw error;
        setCurrentGroup(data);
        setChatMessages([]);
        Alert.alert('สร้างกลุ่มสำเร็จ!', `รหัสเชิญเพื่อนของคุณคือ: ${randomCode}`);
        goTo('GroupDetail', 'Group');
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <Header title="เข้าร่วม / สร้างกลุ่ม" backTo="Home" />
        <ScrollView contentContainerStyle={styles.pad}>
          <ErrorBanner />

          <View style={[styles.cardBox, { backgroundColor: COLORS.blueLight }]}>
            <Text style={styles.sectionTitle}>🤝 เข้าร่วมกลุ่มด้วยรหัส 6 หลัก</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#FFF', marginTop: 10, textAlign: 'center', fontSize: 18, letterSpacing: 4 }]}
              placeholder="เช่น 621028"
              keyboardType="number-pad"
              value={joinCodeInput}
              onChangeText={setJoinCodeInput}
            />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.blue }]} onPress={handleJoinGroup}>
              <Text style={styles.primaryBtnText}>เข้าร่วมกลุ่ม</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.cardBox, { backgroundColor: COLORS.pinkLight, marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>✨ หรือสร้างกลุ่มใหม่</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#FFF', marginTop: 10 }]}
              placeholder="ชื่อกลุ่ม เช่น กลุ่มโปรเจกต์ Mobile"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: '#FFF', marginTop: 10 }]}
              placeholder="รายวิชา (เช่น DX212)"
              value={newGroupSubject}
              onChangeText={setNewGroupSubject}
            />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.pink }]} onPress={handleCreateGroup}>
              <Text style={styles.primaryBtnText}>สร้างกลุ่มใหม่ (สุ่มรหัส 6 หลัก)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const loadGroupMessages = async (code) => {
    const { data } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_code', code)
      .order('created_at', { ascending: true });
    setChatMessages(data || []);
  };

  if (screen === 'GroupDetail') {
    if (!currentGroup) {
      goTo('JoinGroup');
      return null;
    }
    const groupTasks = tasks.filter((t) => t.task_type === 'งานกลุ่ม');

    return (
      <SafeAreaView style={styles.container}>
        <Header title="Detail กลุ่ม" backTo="Home" rightText="เปลี่ยนกลุ่ม" onRightPress={() => goTo('JoinGroup')} />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.pastelBanner, { backgroundColor: COLORS.purpleLight }]}>
            <Text style={styles.bannerTitle}>{currentGroup.name} 🚀</Text>
            <Text style={styles.bannerSub}>รหัสกลุ่ม: {currentGroup.code} • วิชา: {currentGroup.subject}</Text>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: COLORS.pink, width: '48%' }]}
              onPress={() => {
                loadGroupMessages(currentGroup.code);
                goTo('GroupChat');
              }}
            >
              <Text style={styles.primaryBtnText}>💬 แชทกลุ่มจริง</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: COLORS.green, width: '48%' }]}
              onPress={() => {
                setNewTaskType('งานกลุ่ม');
                goTo('CreateTask');
              }}
            >
              <Text style={styles.primaryBtnText}>+ เพิ่มงานกลุ่ม</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>งานกลุ่มที่ได้รับมอบหมาย ({groupTasks.length})</Text>
          {groupTasks.length === 0 ? (
            <View style={[styles.infoBox, { alignItems: 'center', paddingVertical: 22 }]}>
              <Text style={{ color: COLORS.textMuted }}>ยังไม่มีงานกลุ่ม กด "+ เพิ่มงานกลุ่ม" ด้านบนได้เลย</Text>
            </View>
          ) : (
            groupTasks.map((gt) => (
              <View key={gt.id} style={[styles.taskCard, { backgroundColor: COLORS.yellowLight }]}>
                <View>
                  <Text style={styles.taskTitle}>{gt.title}</Text>
                  <Text style={styles.taskTime}>กำหนดส่ง: {gt.due_time}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
        <BottomBar />
      </SafeAreaView>
    );
  }

  if (screen === 'GroupChat' && currentGroup) {
    const sendMsg = async () => {
      if (!chatInput.trim()) return;
      const textToSend = chatInput.trim();
      setChatInput('');
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_code: currentGroup.code,
          sender_name: fullName || 'สมาชิก',
          message: textToSend,
        })
        .select()
        .single();
      if (!error && data) {
        setChatMessages([...chatMessages, data]);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <Header title={`แชท: ${currentGroup.name}`} backTo="GroupDetail" rightText="รีเฟรช" onRightPress={() => loadGroupMessages(currentGroup.code)} />
        <ScrollView contentContainerStyle={styles.pad}>
          {chatMessages.length === 0 ? (
            <View style={[styles.infoBox, { alignItems: 'center', paddingVertical: 20 }]}>
              <Text style={{ color: COLORS.textMuted }}>เริ่มพิมพ์ข้อความคุยกับเพื่อนในกลุ่มได้เลย!</Text>
            </View>
          ) : (
            chatMessages.map((m) => {
              const isMe = m.sender_name === fullName;
              return (
                <View
                  key={m.id}
                  style={[
                    styles.chatBubble,
                    isMe
                      ? { alignSelf: 'flex-end', backgroundColor: COLORS.purpleLight }
                      : { alignSelf: 'flex-start', backgroundColor: COLORS.pinkLight },
                  ]}
                >
                  <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{m.sender_name}</Text>
                  <Text style={{ color: COLORS.textDark, marginTop: 2 }}>{m.message}</Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.chatInputBar}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="พิมพ์ข้อความถึงเพื่อน..."
            value={chatInput}
            onChangeText={setChatInput}
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: COLORS.purple }]} onPress={sendMsg}>
            <Text style={{ color: '#FFF', fontWeight: '700' }}>ส่ง</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'SecAnnouncements') {
    const handlePostSec = async () => {
      if (!newSecTitle.trim()) return;
      const { data, error } = await supabase
        .from('sec_posts')
        .insert({
          sec_code: secCode,
          title: newSecTitle.trim(),
          detail: `ประกาศโดย ${fullName}`,
          is_urgent: false,
        })
        .select()
        .single();
      if (!error && data) {
        setSecPosts([data, ...secPosts]);
        setNewSecTitle('');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <Header title={`ประกาศ ${secCode}`} backTo="Home" />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.row, { marginBottom: 14 }]}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="เพิ่มประกาศใหม่ใน Sec..."
              value={newSecTitle}
              onChangeText={setNewSecTitle}
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: COLORS.yellow }]} onPress={handlePostSec}>
              <Text style={{ fontWeight: '700', color: COLORS.textDark }}>โพสต์</Text>
            </TouchableOpacity>
          </View>

          {secPosts.length === 0 ? (
            <View style={[styles.infoBox, { alignItems: 'center', paddingVertical: 24 }]}>
              <Text style={{ color: COLORS.textMuted }}>ยังไม่มีประกาศใน {secCode}</Text>
            </View>
          ) : (
            secPosts.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.taskCard,
                  { backgroundColor: p.is_urgent ? COLORS.dangerBg : COLORS.yellowLight },
                ]}
              >
                <View>
                  <Text style={[styles.taskTitle, p.is_urgent && { color: '#D94848' }]}>
                    {p.is_urgent ? '🚨 ' : '📢 '}{p.title}
                  </Text>
                  <Text style={styles.taskTime}>{p.detail}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'Notifications') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="การแจ้งเตือน" backTo="Home" />
        <ScrollView contentContainerStyle={styles.pad}>
          {tasks.length === 0 && secPosts.length === 0 ? (
            <View style={[styles.infoBox, { alignItems: 'center', paddingVertical: 24 }]}>
              <Text style={{ color: COLORS.textMuted }}>ยังไม่มีการแจ้งเตือนใหม่ 🎉</Text>
            </View>
          ) : (
            <>
              {secPosts.map((p) => (
                <View key={'s' + p.id} style={[styles.taskCard, { backgroundColor: p.is_urgent ? COLORS.dangerBg : COLORS.yellowLight }]}>
                  <Text>{p.is_urgent ? '🚨 ด่วน: ' : '📢 ประกาศ: '}{p.title}</Text>
                </View>
              ))}
              {tasks.map((t) => (
                <View key={'t' + t.id} style={[styles.taskCard, { backgroundColor: COLORS.blueLight }]}>
                  <Text>⏰ งานค้าง: {t.title} ({t.due_time})</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'Profile') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="โปรไฟล์ของฉัน" />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.pastelBanner, { backgroundColor: COLORS.pinkLight, alignItems: 'center' }]}>
            <View style={styles.logoCircle}><Text style={{ fontSize: 40 }}>👩🏻‍🎓</Text></View>
            <Text style={styles.bannerTitle}>{fullName}</Text>
            <Text style={styles.bannerSub}>รหัสนักศึกษา: {studentId || '-'} • {secCode}</Text>
          </View>

          {[
            { label: '📋 ข้อมูลนักศึกษา (Profile Detail)', target: 'ProfileDetail', bg: COLORS.blueLight },
            { label: '⏰ Wake-up Challenge', target: 'WakeUpChallenge', bg: COLORS.yellowLight },
            { label: '📊 ประวัติการตื่น (Challenge History)', target: 'ChallengeHistory', bg: COLORS.greenLight },
            { label: '🤖 แชทช่วยเหลือ (Help-Wake Chat)', target: 'HelpChat', bg: COLORS.purpleLight },
            { label: '⚙️ ตั้งค่าแอป (App Settings)', target: 'AppSettings', bg: COLORS.card },
          ].map((menu, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuRow, { backgroundColor: menu.bg }]}
              onPress={() => goTo(menu.target)}
            >
              <Text style={styles.menuRowText}>{menu.label}</Text>
              <Text style={{ color: COLORS.textMuted }}>{'>'}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: COLORS.danger, marginTop: 20 }]}
            onPress={handleLogout}
          >
            <Text style={{ color: '#D94848', fontWeight: '700' }}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </ScrollView>
        <BottomBar />
      </SafeAreaView>
    );
  }

  if (screen === 'WakeUpChallenge') {
    const handleWakeCheckin = async () => {
      setLoading(true);
      const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      try {
        const { data: logData, error } = await supabase
          .from('wake_logs')
          .insert({
            user_id: session.user.id,
            checkin_time: `วันนี้ เวลา ${nowTime} น.`,
            points_earned: 50,
          })
          .select()
          .single();
        if (error) throw error;

        const newPoints = wakePoints + 50;
        await supabase.from('profiles').update({ wake_points: newPoints }).eq('id', session.user.id);
        setWakePoints(newPoints);
        setWakeLogs([logData, ...wakeLogs]);
        Alert.alert('เช็กอินสำเร็จ! 🥳', `คุณตื่นนอนเวลา ${nowTime} น. รับ +50 คะแนน (รวม ${newPoints} แต้ม)`);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <Header title="Wake-up Challenge" backTo="Home" />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.pastelBanner, { backgroundColor: COLORS.yellowLight, alignItems: 'center' }]}>
            <Text style={{ fontSize: 48 }}>☀️</Text>
            <Text style={styles.bannerTitle}>คะแนนสะสม: {wakePoints} แต้ม</Text>
            <Text style={styles.bannerSub}>กดเช็กอินตอนเช้าเพื่อสะสมแต้มความขยันลงฐานข้อมูล</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.green }]}
            onPress={handleWakeCheckin}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>⏰ กดเช็กอินตื่นนอนตอนนี้ (+50 แต้ม)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: COLORS.purple }]}
            onPress={() => goTo('ChallengeHistory')}
          >
            <Text style={styles.outlineBtnText}>ดูประวัติการตื่นทั้งหมด ({wakeLogs.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'ProfileDetail') {
    const handleSaveProfile = async () => {
      setLoading(true);
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          student_id: studentId,
          faculty,
          sec_code: secCode,
        })
        .eq('id', session.user.id);
      setLoading(false);
      Alert.alert('บันทึกสำเร็จ', 'อัปเดตข้อมูลนักศึกษาเรียบร้อยแล้ว');
      goTo('Profile');
    };

    return (
      <SafeAreaView style={styles.container}>
        <Header title="ข้อมูลนักศึกษา" backTo="Profile" />
        <ScrollView contentContainerStyle={styles.pad}>
          <Text style={styles.label}>ชื่อ-นามสกุล</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          <Text style={styles.label}>รหัสนักศึกษา</Text>
          <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} />
          <Text style={styles.label}>คณะ / สาขา</Text>
          <TextInput style={styles.input} value={faculty} onChangeText={setFaculty} />
          <Text style={styles.label}>Sec เรียน</Text>
          <TextInput style={styles.input} value={secCode} onChangeText={setSecCode} />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.purple, marginTop: 20 }]}
            onPress={handleSaveProfile}
          >
            <Text style={styles.primaryBtnText}>บันทึกข้อมูลลง Supabase</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'ChallengeHistory') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="ประวัติการตื่น" backTo="Profile" />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.pastelBanner, { backgroundColor: COLORS.greenLight }]}>
            <Text style={styles.bannerTitle}>คะแนนสะสมรวม: {wakePoints} แต้ม 🏆</Text>
            <Text style={styles.bannerSub}>บันทึกการตื่นเช้าของคุณ</Text>
          </View>
          {wakeLogs.length === 0 ? (
            <View style={[styles.infoBox, { alignItems: 'center', paddingVertical: 20 }]}>
              <Text style={{ color: COLORS.textMuted }}>ยังไม่มีประวัติการเช็กอินตื่นนอน</Text>
            </View>
          ) : (
            wakeLogs.map((w) => (
              <View key={w.id} style={[styles.infoBox, { marginBottom: 8 }]}>
                <Text style={{ fontWeight: '600' }}>✅ {w.checkin_time} (+{w.points_earned} แต้ม)</Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'HelpChat') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Help-Wake Chat" backTo="Profile" />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.chatBubble, { backgroundColor: COLORS.blueLight, alignSelf: 'flex-start' }]}>
            <Text>สวัสดี {fullName}! มีอะไรให้ผู้ช่วย Luem-Mai-Dai แนะนำไหม? 🤖✨</Text>
          </View>
          <TouchableOpacity
            style={[styles.menuRow, { backgroundColor: COLORS.pinkLight, marginTop: 12 }]}
            onPress={() => Alert.alert('คำแนะนำ', 'แนะนำให้ตั้งปลุกก่อนเวลาเรียน 45 นาที และกดเช็กอินในหน้า Wake-up Challenge เพื่อรับ 50 แต้ม!')}
          >
            <Text>💡 ขอเคล็ดลับการตื่นเช้าไปเรียน</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuRow, { backgroundColor: COLORS.yellowLight }]}
            onPress={() => Alert.alert('สรุปงานค้าง', `ตอนนี้คุณมีงานค้างในระบบทั้งหมด ${tasks.length} รายการ`)}
          >
            <Text>📋 เช็กจำนวนงานค้างในระบบ</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'AppSettings') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="ตั้งค่าแอป" backTo="Profile" />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={styles.settingRow}>
            <Text style={styles.menuRowText}>🔔 เปิดการแจ้งเตือนทั้งหมด</Text>
            <Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ true: COLORS.purple }} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.menuRowText}>🔊 เสียงเตือนน่ารัก (Pastel Tone)</Text>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ true: COLORS.pink }} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.menuRowText}>🗄️ สถานะฐานข้อมูล</Text>
            <Text style={{ color: '#2E9E6B', fontWeight: '700' }}>เชื่อมต่อ Supabase แล้ว</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'SecAlert') {
    const handleSendUrgent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('sec_posts')
        .insert({
          sec_code: secCode,
          title: urgentMsg,
          detail: `แจ้งเตือนฉุกเฉินโดย ${fullName}`,
          is_urgent: true,
        })
        .select()
        .single();
      setLoading(false);
      if (!error && data) {
        setSecPosts([data, ...secPosts]);
        Alert.alert('ส่งสัญญาณด่วนแล้ว! 🚨', `แจ้งเตือนไปยังเพื่อนใน ${secCode} เรียบร้อย`);
        goTo('Home', 'Home');
      }
    };

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFF5F5' }]}>
        <Header title="Sec Alert (ฉุกเฉิน)" backTo="Home" bg="#FFF5F5" />
        <View style={styles.centerBox}>
          <Text style={{ fontSize: 64 }}>🚨</Text>
          <Text style={[styles.bannerTitle, { color: '#D94848', marginTop: 12 }]}>แจ้งเตือนด่วนถึงเพื่อนใน {secCode}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#FFF', width: '90%', marginTop: 16, textAlign: 'center' }]}
            value={urgentMsg}
            onChangeText={setUrgentMsg}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.danger, width: '90%', marginTop: 16 }]}
            onPress={handleSendUrgent}
            disabled={loading}
          >
            <Text style={[styles.primaryBtnText, { color: '#FFF' }]}>ส่งสัญญาณแจ้งเตือนด่วนทันที</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  pad: { padding: 18, paddingBottom: 40 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  brandTitle: { fontSize: 30, fontWeight: '800', color: COLORS.textDark },
  brandSub: { fontSize: 18, fontWeight: '600', color: '#6B4EFF', marginBottom: 10 },
  brandDesc: { textAlign: 'center', color: COLORS.textMuted, lineHeight: 22, marginBottom: 26 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#6B4EFF', fontWeight: '600', fontSize: 15 },
  rightHeaderText: { color: '#6B4EFF', fontWeight: '700', fontSize: 15 },
  primaryBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  outlineBtn: {
    width: '100%', paddingVertical: 13, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.textDark,
  },
  errorBox: {
    backgroundColor: COLORS.dangerBg, borderWidth: 1, borderColor: COLORS.danger,
    padding: 12, borderRadius: 12, marginBottom: 12, width: '100%',
  },
  errorText: { color: '#D94848', fontSize: 13, fontWeight: '600' },
  pastelBanner: { padding: 18, borderRadius: 20, marginBottom: 14 },
  bannerTitle: { fontSize: 19, fontWeight: '800', color: COLORS.textDark },
  bannerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greetingText: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  subGreeting: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  iconBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  quickCard: {
    width: '48%', padding: 16, borderRadius: 18, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  quickIcon: { fontSize: 22, marginRight: 10 },
  quickText: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  alertStrip: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14,
    borderWidth: 1, marginBottom: 18,
  },
  emptyBox: { padding: 26, borderRadius: 22, alignItems: 'center', marginTop: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  emptySub: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, marginTop: 6, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 10 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 18, marginBottom: 10,
  },
  taskTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  taskTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tagText: { fontSize: 12, fontWeight: '700', color: COLORS.textDark },
  selectPill: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  infoBox: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  cardBox: { padding: 18, borderRadius: 20 },
  chatBubble: { padding: 12, borderRadius: 16, maxWidth: '80%', marginBottom: 10 },
  chatInputBar: {
    flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border,
    alignItems: 'center', gap: 8, backgroundColor: '#FFF',
  },
  sendBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 16, marginBottom: 10,
  },
  menuRowText: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#FFF',
  },
  tabItem: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  tabLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});