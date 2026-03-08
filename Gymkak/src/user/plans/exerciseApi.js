// ตรวจสอบ login ก่อนใช้งาน API
function checkAuthenticationForAPI() {
    const token = localStorage.getItem('gymkak_token');
    if (!token) {
        console.warn('User not authenticated');
        return false;
    }
    return true;
}

// API สำหรับดึงข้อมูลท่าจากฐานข้อมูล
const API_BASE_URL = 'http://localhost:5000/api';

// ดึงข้อมูลท่าตามหมวดหมู่
async function fetchExercisesByCategory(category) {
  if (!checkAuthenticationForAPI()) {
    window.location.href = '/Gymkak/src/user/login/login.html';
    return [];
  }
  
  try {
    const token = localStorage.getItem('gymkak_token');
    const response = await fetch(`${API_BASE_URL}/exercises-tags/by-category/${category}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      console.error('Error fetching exercises:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

// ดึงข้อมูลท่าตามชื่อ
async function fetchExerciseByName(name) {
  if (!checkAuthenticationForAPI()) {
    window.location.href = '/Gymkak/src/user/login/login.html';
    return null;
  }
  
  try {
    const token = localStorage.getItem('gymkak_token');
    const response = await fetch(`${API_BASE_URL}/exercises-tags/search/${encodeURIComponent(name)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      console.error('Error fetching exercise:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

// ดึง User ID สำหรับ storage
function getUserIdForStorage() {
  let userId = null;
  
  const userData = sessionStorage.getItem('gymkak_user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userId = user.id;
    } catch (e) {
      console.warn('Error parsing user data:', e);
    }
  }
  
  return userId;
}

// สร้าง user-specific key
function getUserStorageKey(key) {
  const userId = getUserIdForStorage();
  if (!userId) {
    console.warn('Warning: No user ID found, using generic key');
    return key;
  }
  return `${userId}_${key}`;
}

// เก็บข้อมูลท่าที่เลือกไว้ใน localStorage
function saveSelectedExercise(dayIndex, exerciseName, section) {
  const baseKey = `selectedExercise_day${dayIndex}`;
  const userKey = getUserStorageKey(baseKey);
  const exerciseData = {
    name: exerciseName,
    section: section,
    timestamp: new Date().getTime()
  };
  
  localStorage.setItem(userKey, JSON.stringify(exerciseData));
  console.log(`Saved exercise: ${exerciseName} for day ${dayIndex}`);
}

// ดึงข้อมูลท่าที่บันทึกไว้
function getSelectedExercise(dayIndex) {
  const baseKey = `selectedExercise_day${dayIndex}`;
  const userKey = getUserStorageKey(baseKey);
  const data = localStorage.getItem(userKey);
  
  if (data) {
    return JSON.parse(data);
  }
  return null;
}

// ลบข้อมูลท่าที่บันทึก
function deleteSelectedExercise(dayIndex) {
  const baseKey = `selectedExercise_day${dayIndex}`;
  const userKey = getUserStorageKey(baseKey);
  localStorage.removeItem(userKey);
  console.log(`Deleted exercise for day ${dayIndex}`);
}

// แสดงท่าในตาราง
async function displayExerciseInTable(dayIndex, exerciseName, section) {
  // ดึงข้อมูลท่าจาก MongoDB
  const exercise = await fetchExerciseByName(exerciseName);
  
  if (exercise) {
    // หาตำแหน่งในตารางและแสดง
    const tableCell = document.querySelector(`[data-day="${dayIndex}"][data-section="${section}"]`);
    
    if (tableCell) {
      tableCell.innerHTML = `
        <div class="exercise-cell">
          <h4>${exercise.name}</h4>
          <p class="exercise-tags">${exercise.tags.join(' • ')}</p>
          <small class="exercise-muscle">${exercise.targetMuscle}</small>
        </div>
      `;
    }
  }
}

// ส่วนสำหรับ link ไปหน้า program page พร้อม dayIndex
function linkToProgramPage(programType, dayIndex, section) {
  // เก็บข้อมูล dayIndex และ section ไว้ใน sessionStorage เพื่อให้ program page ใช้ได้
  sessionStorage.setItem('selectedDayIndex', dayIndex);
  sessionStorage.setItem('selectedSection', section);
  sessionStorage.setItem('selectedProgram', programType);
  
  // Link ไปหน้า program page
  const programPages = {
    weight: '/Gymkak/src/program/weight/weight.html',
    cardio: '/Gymkak/src/program/cardio/cardio.html',
    calisthenics: '/Gymkak/src/program/calisthenics/calisthenics.html'
  };
  
  if (programPages[programType]) {
    window.location.href = programPages[programType];
  }
}

// Handle เมื่อกลับมาจากหน้า program page
async function handleReturnFromProgramPage() {
  const dayIndex = sessionStorage.getItem('selectedDayIndex');
  const section = sessionStorage.getItem('selectedSection');
  const programType = sessionStorage.getItem('selectedProgram');
  const selectedExerciseName = sessionStorage.getItem('selectedExerciseName');
  
  if (dayIndex && selectedExerciseName) {
    // บันทึกท่าที่เลือก
    saveSelectedExercise(dayIndex, selectedExerciseName, section);
    
    // แสดงท่าในตาราง
    await displayExerciseInTable(dayIndex, selectedExerciseName, section);
    
    // ล้าง sessionStorage
    sessionStorage.removeItem('selectedDayIndex');
    sessionStorage.removeItem('selectedSection');
    sessionStorage.removeItem('selectedProgram');
    sessionStorage.removeItem('selectedExerciseName');
  }
}

// รับ query parameter จาก URL
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
