const DASHBOARD_REDIRECT_URL = 'http://127.0.0.1:5500/Gymkak/src/dashboard/dashboard.html';
const LOGIN_PAGE = '/Gymkak/src/user/login/login.html';

function setupLoginLogoutToggle() {
    const authLinks = document.querySelectorAll('a[href*="/user/login/login.html"]');
    if (!authLinks.length) {
        return;
    }

    const token = localStorage.getItem('gymkak_token') || localStorage.getItem('token');
    const isLoggedIn = !!token;

    authLinks.forEach(link => {
        const iconElement = link.querySelector('i');
        
        if (isLoggedIn) {
            // User is logged in - show Logout
            if (iconElement) {
                iconElement.className = 'ri-logout-box-line';
            }
            link.textContent = '';
            if (iconElement) {
                link.appendChild(iconElement);
            }
            link.appendChild(document.createTextNode(' Logout'));

            link.addEventListener('click', function (event) {
                event.preventDefault();
                clearAuthStorage();
                window.location.href = DASHBOARD_REDIRECT_URL;
            });
        } else {
            // User not logged in - show Login
            if (iconElement) {
                iconElement.className = 'ri-login-box-line';
            }
            link.textContent = '';
            if (iconElement) {
                link.appendChild(iconElement);
            }
            link.appendChild(document.createTextNode(' Login'));
            link.href = LOGIN_PAGE;
        }
    });
}

function clearAuthStorage() {
    localStorage.removeItem('gymkak_token');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('selectedPrice');
    localStorage.removeItem('membershipRenewMode');
    sessionStorage.removeItem('gymkak_user');
}

// ตรวจสอบ login ก่อนใช้งาน
function checkLoginStatus() {
    const token = localStorage.getItem('gymkak_token');
    if (!token) {
        // ถ้ายังไม่ login ให้ redirect ไปหน้า login
        window.location.href = '/Gymkak/src/user/login/login.html';
        return false;
    }
    return true;
}

// ดึง User ID จาก sessionStorage หรือ API
function getUserId() {
    let userId = null;
    
    // ลองดึงจาก sessionStorage ก่อน
    const userData = sessionStorage.getItem('gymkak_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            userId = user.id;
        } catch (e) {
            console.warn('Error parsing user data:', e);
        }
    }
    
    // ถ้าไม่มี ให้โหลดจาก API
    if (!userId) {
        fetchUserIdFromAPI();
    }
    
    return userId;
}

// ดึง User ID จาก API
async function fetchUserIdFromAPI() {
    try {
        const token = localStorage.getItem('gymkak_token');
        const response = await fetch('http://localhost:5000/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (data.success && data.data.id) {
            // บันทึกลง sessionStorage
            const userData = { id: data.data.id, username: data.data.username };
            sessionStorage.setItem('gymkak_user', JSON.stringify(userData));
            return data.data.id;
        }
    } catch (error) {
        console.error('Error fetching user ID:', error);
    }
    return null;
}

// สร้าง localStorage key ที่เฉพาะเจาะจงตามผู้ใช้
function getUserStorageKey(key) {
    const userId = getUserId();
    if (!userId) {
        console.warn('Warning: No user ID found, using generic key');
        return key;
    }
    return `${userId}_${key}`;
}

// เรียกใช้ตรวจสอบ login ทันทีเมื่อ script โหลด
if (!checkLoginStatus()) {
    throw new Error('User not authenticated');
}

// 7-day push/pull/leg cycle (start empty, user builds their own plan)
const workoutDays = [
    { label: "PUSH", subtitle: "Chest • Shoulder • Triceps", exercises: [] },
    { label: "PULL", subtitle: "Back • Biceps", exercises: [] },
    { label: "LEG & SHOULDER", subtitle: "Leg • Shoulder", exercises: [] },
    { label: "CARDIO", subtitle: "Cardio • Endurance", exercises: [] },
    { label: "REST", subtitle: "Recovery", exercises: [] }
];

const MAX_EXERCISES_PER_COLUMN = 12;
let pendingDeleteCallback = null;

// Load plans from localStorage
function loadPlansFromLocalStorage() {
    const userKey = getUserStorageKey('workoutPlan');
    const saved = localStorage.getItem(userKey);
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            if (Array.isArray(loaded) && loaded.length === workoutDays.length) {
                loaded.forEach((day, idx) => {
                    workoutDays[idx].exercises = Array.isArray(day.exercises) ? day.exercises : [];
                    // โหลด label และ subtitle ที่ผู้ใช้แก้ไขแล้ว
                    if (day.label) {
                        workoutDays[idx].label = day.label;
                    }
                    if (day.subtitle) {
                        workoutDays[idx].subtitle = day.subtitle;
                    }
                });
                console.log('✅ โหลดตารางจาก localStorage สำเร็จ');
            }
        } catch (e) {
            console.warn('โหลด localStorage ล้มเหลว:', e);
        }
    }
}

// โหลดท่าใหม่ที่บันทึกจาก program page (ใช้ sessionStorage เพื่อหลีกเลี่ยง Tracking Prevention)
function loadNewExerciseFromSessionStorage() {
    console.log('🔍 Checking storage for new exercises...');

    let hasChanges = false;

    const addExercise = (dayIndex, exercise, index = 0) => {
        if (!(dayIndex >= 0 && dayIndex < workoutDays.length)) return;
        if (!exercise || !exercise.name) return;

        if (workoutDays[dayIndex].exercises.length >= MAX_EXERCISES_PER_COLUMN) {
            return;
        }

        const alreadyExists = workoutDays[dayIndex].exercises.find(ex => ex.name === exercise.name);
        if (alreadyExists) return;

        workoutDays[dayIndex].exercises.push({
            name: exercise.name,
            sets: exercise.sets || 3,
            reps: exercise.reps || '8-10',
            id: `ex_${Date.now()}_${dayIndex}_${index}`
        });
        hasChanges = true;
    };

    const batchRaw = localStorage.getItem('planAddExercises');
    if (batchRaw) {
        try {
            const batchData = JSON.parse(batchRaw);
            const dayIndex = parseInt(batchData.dayIndex, 10);
            const exercises = Array.isArray(batchData.exercises) ? batchData.exercises : [];
            exercises.forEach((exercise, index) => addExercise(dayIndex, exercise, index));
        } catch (error) {
            console.error('Error loading planAddExercises:', error);
        } finally {
            localStorage.removeItem('planAddExercises');
        }
    }

    const singleRaw = sessionStorage.getItem('newExerciseToAdd');
    if (singleRaw) {
        try {
            const singleData = JSON.parse(singleRaw);
            addExercise(parseInt(singleData.dayIndex, 10), {
                name: singleData.name,
                sets: 3,
                reps: '8-10'
            });
        } catch (error) {
            console.error('Error loading newExerciseToAdd:', error);
        } finally {
            sessionStorage.removeItem('newExerciseToAdd');
        }
    }

    if (hasChanges) {
        savePlansToLocalStorage();
    }
}

// โหลดท่าที่เลือกจาก program page
function loadSelectedExercisesFromProgram() {
    console.log('🔍 Checking for selected exercises in localStorage...');
    
    for (let i = 0; i < workoutDays.length; i++) {
        // Check for multiple exercises (new system)
        let exercisesAdded = false;
        let index = 0;
        
        while (true) {
            const baseKey = `selectedExercise_day${i}_${index}`;
            const userKey = getUserStorageKey(baseKey);
            const data = localStorage.getItem(userKey);
            
            if (!data) break;
            
            try {
                const exerciseData = JSON.parse(data);
                const exerciseName = exerciseData.name;
                
                console.log(`Found exercise for day ${i}, index ${index}: ${exerciseName}`);
                
                if (!workoutDays[i].exercises.find(ex => ex.name === exerciseName)) {
                    if (workoutDays[i].exercises.length < MAX_EXERCISES_PER_COLUMN) {
                        workoutDays[i].exercises.push({
                            name: exerciseName,
                            sets: 3,
                            reps: '8-10',
                            id: `ex_${Date.now()}_${i}_${index}`
                        });
                        console.log(`✅ Added exercise: ${exerciseName} to day ${i}`);
                        exercisesAdded = true;
                    }
                }
                
                // Remove from localStorage
                localStorage.removeItem(userKey);
                console.log(`Removed key: ${userKey} from localStorage`);
            } catch (e) {
                console.warn('Error loading selected exercise:', e);
            }
            
            index++;
        }
        
        // Also check for old single exercise format (backward compatibility)
        const oldBaseKey = `selectedExercise_day${i}`;
        const oldUserKey = getUserStorageKey(oldBaseKey);
        const oldData = localStorage.getItem(oldUserKey);
        
        if (oldData) {
            try {
                const exerciseData = JSON.parse(oldData);
                const exerciseName = exerciseData.name;
                
                console.log(`Found exercise (old format) for day ${i}: ${exerciseName}`);
                
                if (!workoutDays[i].exercises.find(ex => ex.name === exerciseName)) {
                    if (workoutDays[i].exercises.length < MAX_EXERCISES_PER_COLUMN) {
                        workoutDays[i].exercises.push({
                            name: exerciseName,
                            sets: 3,
                            reps: '8-10',
                            id: `ex_${Date.now()}_${i}`
                        });
                        console.log(`✅ Added exercise: ${exerciseName} to day ${i}`);
                        exercisesAdded = true;
                    }
                }
                
                localStorage.removeItem(oldUserKey);
                console.log(`Removed key: ${oldUserKey} from localStorage`);
            } catch (e) {
                console.warn('Error loading selected exercise:', e);
            }
        }
    }
    
    // บันทึกตารางใหม่
    console.log('Saving updated workoutDays to localStorage');
    savePlansToLocalStorage();
}

// Save plans to localStorage
function savePlansToLocalStorage() {
    try {
        const userKey = getUserStorageKey('workoutPlan');
        localStorage.setItem(userKey, JSON.stringify(workoutDays));
        console.log('💾 บันทึกตารางลง localStorage สำเร็จ');
    } catch (e) {
        console.error('บันทึกล้มเหลว:', e);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOMContentLoaded fired');
    
    // Setup login/logout toggle
    setupLoginLogoutToggle();
    
    // 1. โหลดข้อมูลเดิมจาก localStorage
    loadPlansFromLocalStorage();
    
    // 2. โหลดท่าใหม่ที่เพิ่งบันทึกจาก program page (sessionStorage)
    loadNewExerciseFromSessionStorage();
    
    // 3. โหลดท่าที่เลือกจาก program page (localStorage)
    loadSelectedExercisesFromProgram();
    
    // 4. Render ตาราง (ต้องเรียกหลังจากเพิ่มท่าใหม่)
    renderAllDays();
    
    // 5. Setup event listeners
    setupEventListeners();
    setupConfirmationDialog();
    
    console.log('✅ Initialization complete');
    console.log('Current workoutDays:', workoutDays);
});

// Setup event listeners
function setupEventListeners() {
    const planDownloadBtnMain = document.getElementById('planDownloadBtnMain');
    if (planDownloadBtnMain) {
        planDownloadBtnMain.addEventListener('click', downloadAllPlansAsImage);
    }
    
    // Edit button
    const planEditBtnMain = document.getElementById('planEditBtnMain');
    if (planEditBtnMain) {
        planEditBtnMain.addEventListener('click', openBulkEditModal);
    }
    
    // Edit modal buttons
    const saveExerciseBtn = document.getElementById('saveExerciseBtn');
    if (saveExerciseBtn) {
        saveExerciseBtn.addEventListener('click', saveEditedExercise);
    }
    
    const deleteExerciseBtn = document.getElementById('deleteExerciseBtn');
    if (deleteExerciseBtn) {
        deleteExerciseBtn.addEventListener('click', deleteEditedExercise);
    }

    // Dropdown menu
    const menuButton = document.getElementById('menuButton');
    const dropdownMenu = document.getElementById('plansDropdownMenu');

    if (menuButton && dropdownMenu) {
        menuButton.addEventListener('click', function () {
            dropdownMenu.style.opacity = dropdownMenu.style.opacity === '1' ? '0' : '1';
            dropdownMenu.style.visibility = dropdownMenu.style.visibility === 'visible' ? 'hidden' : 'visible';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.dropdown-container')) {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
            }
        });
    }
}

// Setup confirmation dialog
function setupConfirmationDialog() {
    const dialog = document.getElementById('confirmationDialog');
    const cancelBtn = document.getElementById('confirmationCancel');
    const okBtn = document.getElementById('confirmationOk');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideConfirmation);
    }

    if (okBtn) {
        okBtn.addEventListener('click', function () {
            if (pendingDeleteCallback) {
                pendingDeleteCallback();
            }
            hideConfirmation();
        });
    }

    if (dialog) {
        dialog.addEventListener('click', function (e) {
            if (e.target === dialog) {
                hideConfirmation();
            }
        });
    }
}

function showConfirmation(message, callback) {
    const dialog = document.getElementById('confirmationDialog');
    const messageEl = document.getElementById('confirmationMessage');
    
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    pendingDeleteCallback = callback;
    
    if (dialog) {
        dialog.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideConfirmation() {
    const dialog = document.getElementById('confirmationDialog');
    if (dialog) {
        dialog.classList.remove('show');
        document.body.style.overflow = '';
    }
    pendingDeleteCallback = null;
}

// Render all 7 days in a table format
function renderAllDays() {
    console.log('📊 renderAllDays called');
    console.log('Current workoutDays state:', JSON.stringify(workoutDays, null, 2));
    
    const tableWrapper = document.getElementById('planTableWrapper');
    if (!tableWrapper) {
        console.error('❌ planTableWrapper not found');
        return;
    }

    tableWrapper.innerHTML = '';

    // Create table structure
    const table = document.createElement('div');
    table.className = 'plan__table';

    // Create header row
    const headerRow = document.createElement('div');
    headerRow.className = 'plan__table-header';
    
    workoutDays.forEach((day, dayIndex) => {
        console.log(`Day ${dayIndex} (${day.label}): ${day.exercises.length} exercises`);
        
        const headerCell = document.createElement('div');
        headerCell.className = `plan__table-header-cell plan__table-header-cell--${day.label.toLowerCase().replace(/\s/g, '-').replace(/&/g, '')}`;
        
        headerCell.innerHTML = `
            <h3>${day.label}</h3>
            <p>${day.subtitle}</p>
            ${day.label !== 'REST' ? `
                <button class="plan__add-exercise-btn" data-day-index="${dayIndex}" title="เพิ่มท่า">
                    <i class="ri-add-line"></i>
                </button>
            ` : `
                <button class="plan__add-exercise-btn" disabled style="opacity: 0.5; cursor: not-allowed;">
                    <i class="ri-add-line"></i>
                </button>
            `}
        `;
        headerRow.appendChild(headerCell);
    });
    
    table.appendChild(headerRow);

    // Create body with exercises
    const bodyRow = document.createElement('div');
    bodyRow.className = 'plan__table-body';
    
    workoutDays.forEach((day, dayIndex) => {
        const column = document.createElement('div');
        column.className = 'plan__table-column';
        column.dataset.dayIndex = dayIndex;
        
        // Add exercises
        day.exercises.forEach((exercise, exIndex) => {
            console.log(`  - Exercise ${exIndex}: ${exercise.name}`);
            
            const cell = document.createElement('div');
            cell.className = 'plan__table-cell';
            cell.draggable = true;
            cell.dataset.dayIndex = dayIndex;
            cell.dataset.exerciseIndex = exIndex;
            cell.innerHTML = `
                <div class="plan__table-cell-content" data-day-index="${dayIndex}" data-exercise-index="${exIndex}">
                    <div class="plan__table-cell-name">${exercise.name}</div>
                    <div class="plan__table-cell-meta">${exercise.sets} sets • ${exercise.reps}</div>
                </div>
                <div class="plan__table-cell-actions">
                    <button class="plan__table-cell-edit" data-day-index="${dayIndex}" data-exercise-index="${exIndex}" title="แก้ไข">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="plan__table-cell-delete" data-day-index="${dayIndex}" data-exercise-index="${exIndex}" title="ลบ">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
            `;
            column.appendChild(cell);
        });
        
        // Add empty placeholder if no exercises
        if (day.exercises.length === 0) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'plan__table-cell plan__table-cell--empty';
            emptyCell.innerHTML = `
                <div class="plan__table-cell-empty-text">ยังไม่มีท่าออกกำลังกาย<br>กดปุ่ม + ด้านบนเพื่อเพิ่ม</div>
            `;
            column.appendChild(emptyCell);
        }
        
        bodyRow.appendChild(column);
    });
    
    table.appendChild(bodyRow);
    tableWrapper.appendChild(table);
    
    setupTableEventListeners();
}

function setupTableEventListeners() {
    // Add exercise buttons
    document.querySelectorAll('.plan__add-exercise-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const dayIndex = parseInt(this.dataset.dayIndex);
            openProgramSelectDropdown(dayIndex, this);
        });
    });
    
    // Edit exercise buttons
    document.querySelectorAll('.plan__table-cell-edit').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const dayIndex = parseInt(this.dataset.dayIndex);
            const exIndex = parseInt(this.dataset.exerciseIndex);
            openEditExerciseModal(dayIndex, exIndex);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.plan__table-cell-delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const dayIndex = parseInt(this.dataset.dayIndex);
            const exIndex = parseInt(this.dataset.exerciseIndex);
            deleteExerciseFromTable(dayIndex, exIndex);
        });
    });
    
    // Click on exercise to edit
    document.querySelectorAll('.plan__table-cell-content').forEach(content => {
        content.addEventListener('click', function() {
            const dayIndex = parseInt(this.dataset.dayIndex);
            const exIndex = parseInt(this.dataset.exerciseIndex);
            openEditExerciseModal(dayIndex, exIndex);
        });
    });
    
    // Setup drag and drop
    setupTableDragAndDrop();
    
    // Setup program select dropdown
    setupProgramSelectDropdown();
}

// Store current day index for program navigation
let currentDayIndexForProgramSelect = null;

// Open program selection dropdown
function openProgramSelectDropdown(dayIndex, button) {
    currentDayIndexForProgramSelect = dayIndex;
    const dropdown = document.getElementById('programSelectDropdown');
    
    // Get button position
    const rect = button.getBoundingClientRect();
    
    // Position dropdown below button using absolute positioning
    dropdown.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.display = 'block';
    
    // Close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closeDropdown);
    }, 100);
}

function closeDropdown() {
    const dropdown = document.getElementById('programSelectDropdown');
    dropdown.style.display = 'none';
    document.removeEventListener('click', closeDropdown);
}

// Setup program select dropdown
function setupProgramSelectDropdown() {
    const dropdownItems = document.querySelectorAll('.program-select-dropdown-item');
    
    dropdownItems.forEach(btn => {
        btn.addEventListener('click', function() {
            const program = this.dataset.program;
            const dayIndex = currentDayIndexForProgramSelect;
            
            if (dayIndex !== null) {
                // Map program to URL
                let programUrl = '';
                switch(program) {
                    case 'weight':
                        programUrl = '/Gymkak/src/program/weight/weight.html';
                        break;
                    case 'cardio':
                        programUrl = '/Gymkak/src/program/cardio/cardio.html';
                        break;
                    case 'calisthenics':
                        programUrl = '/Gymkak/src/program/calisthenics/calisthenics.html';
                        break;
                }
                
                // Close dropdown and navigate
                closeDropdown();
                window.location.href = `${programUrl}?dayIndex=${dayIndex}`;
            }
        });
        
        // Hover effects
        btn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.08)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.background = 'none';
        });
    });
}

function showAddExerciseMenu(dayIndex, button) {
    // Remove any existing menu
    const existingMenu = document.querySelector('.plan__add-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'plan__add-menu';
    menu.innerHTML = `
        <a class="plan__add-menu-item" href="/src/program/weight/weight.html?fromPlan=1&day=${dayIndex}">
            <i class="ri-dumbbell-line"></i> Weight Training
        </a>
        <a class="plan__add-menu-item" href="/src/program/cardio/cardio.html?fromPlan=1&day=${dayIndex}">
            <i class="ri-run-line"></i> Cardio
        </a>
        <a class="plan__add-menu-item" href="/src/program/calisthenics/calisthenics.html?fromPlan=1&day=${dayIndex}">
            <i class="ri-fire-line"></i> Calisthenics
        </a>
        <a class="plan__add-menu-item" href="/src/program/bodyweight/bodyweight.html?fromPlan=1&day=${dayIndex}">
            <i class="ri-body-scan-line"></i> Bodyweight
        </a>
    `;
    
    button.parentElement.appendChild(menu);
    menu.classList.add('show');
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 10);
}

function deleteExerciseFromTable(dayIndex, exIndex) {
    const exerciseName = workoutDays[dayIndex].exercises[exIndex]?.name || 'ท่านี้';
    showConfirmation(`ต้องการลบ "${exerciseName}" ใช่หรือไม่?`, () => {
        workoutDays[dayIndex].exercises.splice(exIndex, 1);
        renderAllDays();
        savePlansToLocalStorage();
    });
}

function openEditExerciseModal(dayIndex, exIndex) {
    const exercise = workoutDays[dayIndex].exercises[exIndex];
    if (!exercise) return;
    
    document.getElementById('editName').value = exercise.name;
    document.getElementById('editSets').value = exercise.sets;
    document.getElementById('editReps').value = exercise.reps;
    
    // Store current editing indices
    window.currentEditDayIndex = dayIndex;
    window.currentEditExIndex = exIndex;
    
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

function saveEditedExercise() {
    const name = document.getElementById('editName').value.trim();
    const sets = parseInt(document.getElementById('editSets').value);
    const reps = document.getElementById('editReps').value.trim();
    
    if (!name || !sets || !reps) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }
    
    const dayIndex = window.currentEditDayIndex;
    const exIndex = window.currentEditExIndex;
    
    if (dayIndex !== undefined && exIndex !== undefined && workoutDays[dayIndex].exercises[exIndex]) {
        workoutDays[dayIndex].exercises[exIndex] = {
            name,
            sets,
            reps
        };
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        modal.hide();
        renderAllDays();
        savePlansToLocalStorage();
    }
}

function deleteEditedExercise() {
    const dayIndex = window.currentEditDayIndex;
    const exIndex = window.currentEditExIndex;
    
    if (dayIndex !== undefined && exIndex !== undefined) {
        const exerciseName = workoutDays[dayIndex].exercises[exIndex]?.name || 'ท่านี้';
        showConfirmation(`ต้องการลบ "${exerciseName}" ใช่หรือไม่?`, () => {
            workoutDays[dayIndex].exercises.splice(exIndex, 1);
            const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            modal.hide();
            renderAllDays();
            savePlansToLocalStorage();
        });
    }
}

function setupTableDragAndDrop() {
    let draggedElement = null;
    let draggedDayIndex = -1;
    let draggedExIndex = -1;
    
    const cells = document.querySelectorAll('.plan__table-cell:not(.plan__table-cell--empty)');
    
    cells.forEach(cell => {
        cell.addEventListener('dragstart', function(e) {
            draggedElement = this;
            draggedDayIndex = parseInt(this.dataset.dayIndex);
            draggedExIndex = parseInt(this.dataset.exerciseIndex);
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        cell.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            cells.forEach(c => c.classList.remove('drag-over'));
            draggedElement = null;
        });
        
        cell.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (this !== draggedElement) {
                this.classList.add('drag-over');
            }
        });
        
        cell.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        cell.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedElement && this !== draggedElement) {
                const targetDayIndex = parseInt(this.dataset.dayIndex);
                const targetExIndex = parseInt(this.dataset.exerciseIndex);
                
                // Same column - reorder
                if (draggedDayIndex === targetDayIndex) {
                    const exercises = workoutDays[draggedDayIndex].exercises;
                    const [movedEx] = exercises.splice(draggedExIndex, 1);
                    exercises.splice(targetExIndex, 0, movedEx);
                } else {
                    // Different column - move
                    const [movedEx] = workoutDays[draggedDayIndex].exercises.splice(draggedExIndex, 1);
                    workoutDays[targetDayIndex].exercises.splice(targetExIndex, 0, movedEx);
                }
                
                renderAllDays();
                savePlansToLocalStorage();
            }
            cells.forEach(c => c.classList.remove('drag-over'));
        });
    });
    
    // Allow dropping on empty columns
    const columns = document.querySelectorAll('.plan__table-column');
    columns.forEach(column => {
        column.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        column.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedElement) {
                const targetDayIndex = parseInt(this.dataset.dayIndex);
                if (draggedDayIndex !== targetDayIndex) {
                    const [movedEx] = workoutDays[draggedDayIndex].exercises.splice(draggedExIndex, 1);
                    workoutDays[targetDayIndex].exercises.push(movedEx);
                    renderAllDays();
                    savePlansToLocalStorage();
                }
            }
        });
    });
}

function handlePendingPlanAdd() {
    const raw = localStorage.getItem('planAddExercises');
    console.log('🔍 ตรวจสอบ localStorage:', raw);
    if (!raw) return;
    
    try {
        const payload = JSON.parse(raw);
        console.log('📦 ข้อมูลที่ได้:', payload);
        
        const dayIndex = Number.isInteger(payload.dayIndex) && payload.dayIndex >= 0 && payload.dayIndex < workoutDays.length
            ? payload.dayIndex
            : 0;
        
        const pending = Array.isArray(payload.exercises) ? payload.exercises : [];
        if (pending.length === 0) {
            console.log('⚠️ ไม่มีท่าในข้อมูล');
            return;
        }
        
        const toAdd = pending.map(ex => ({
            name: (ex.name || '').trim(),
            sets: ex.sets || 3,
            reps: ex.reps || '10-12'
        })).filter(ex => ex.name);
        
        if (toAdd.length === 0) return;
        
        workoutDays[dayIndex].exercises.push(...toAdd);
        console.log('✅ เพิ่มท่าสำเร็จ:', toAdd.length, 'ท่า ใน', workoutDays[dayIndex].label);
        console.log('📋 ท่าทั้งหมด:', workoutDays[dayIndex].exercises);
        
        renderAllDays();
        savePlansToLocalStorage();
        console.log('🎨 Render ตารางใหม่แล้ว');
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        localStorage.removeItem('planAddExercises');
    }
}

function downloadAllPlansAsImage() {
    const tableWrapper = document.getElementById('planTableWrapper');
    if (!tableWrapper) return;

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.background = '#0b0d0f';
    tempContainer.style.padding = '40px';
    tempContainer.style.fontFamily = 'Poppins, sans-serif';
    tempContainer.style.minWidth = '1200px';
    
    const clonedTable = tableWrapper.cloneNode(true);
    
    // Hide delete buttons
    clonedTable.querySelectorAll('.plan__table-cell-delete, .plan__add-exercise-btn').forEach(btn => {
        btn.style.display = 'none';
    });
    
    tempContainer.appendChild(clonedTable);
    document.body.appendChild(tempContainer);

    html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#0b0d0f',
        logging: false,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10);
        link.href = canvas.toDataURL('image/png');
        link.download = `Workout-Plan-${timestamp}.png`;
        link.click();
        document.body.removeChild(tempContainer);
    }).catch(error => {
        console.error('Error downloading image:', error);
        alert('เกิดข้อผิดพลาดในการดาวโหลดรูปภาพ');
        document.body.removeChild(tempContainer);
    });
}

// Render plan grid
function renderPlan() {
    const currentDay = workoutDays[currentDayIndex];
    const planGrid = document.getElementById('planGrid');
    const planTitle = document.getElementById('planTitle');
    const planSubtitle = document.getElementById('planSubtitle');

    planTitle.textContent = currentDay.type;
    planSubtitle.textContent = currentDay.subtitle;
    planGrid.innerHTML = '';

    const exercises = currentDay.exercises || [];
    const maxSlots = MAX_EXERCISES_PER_DAY;

    if (exercises.length === 0) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'plan__cell plan__cell-empty';
        emptyCell.innerHTML = `
            <div class="plan__cell-title">ยังไม่มีตารางออกกำลังกาย</div>
            <div class="plan__cell-meta">กด “เพิ่มท่าออกกำลังกาย” เพื่อเลือกท่าจากเมนู Program</div>
        `;
        planGrid.appendChild(emptyCell);
    }

    exercises.forEach((exercise, idx) => {
        const cell = document.createElement('div');
        cell.className = 'plan__cell';
        cell.draggable = true;
        cell.dataset.exerciseIndex = idx;

        cell.innerHTML = `
            <div>
                <button
                    class="exercise-link plan__cell-title"
                    data-index="${idx}"
                    type="button"
                >
                    ${exercise.name}
                </button>
                <div class="plan__cell-meta">${exercise.sets} sets • ${exercise.reps}</div>
            </div>
        `;

        planGrid.appendChild(cell);
    });

    const usedSlots = Math.max(exercises.length, exercises.length === 0 ? 1 : 0);
    const placeholdersToAdd = Math.max(0, maxSlots - usedSlots);
    for (let i = 0; i < placeholdersToAdd; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'plan__cell plan__cell-placeholder';
        placeholder.innerHTML = `
            <div class="plan__cell-title">ช่องว่าง</div>
            <div class="plan__cell-meta">เพิ่มท่าจากเมนู Program</div>
        `;
        planGrid.appendChild(placeholder);
    }

    updateDayDisplay();
    updatePlanAddLinks();
    setupGridDragAndDrop();
}

function updatePlanAddLinks() {
    const links = document.querySelectorAll('.plan__dropup-item');
    links.forEach(link => {
        const base = link.dataset.base || link.getAttribute('href');
        if (!base) return;
        link.setAttribute('href', `${base}?fromPlan=1&day=${currentDayIndex}`);
    });
}

function handlePendingPlanAdd() {
    const raw = localStorage.getItem('planAddExercises');
    if (!raw) return;
    try {
        const payload = JSON.parse(raw);
        const dayIndex = Number.isInteger(payload.dayIndex) && payload.dayIndex >= 0 && payload.dayIndex < workoutDays.length
            ? payload.dayIndex
            : currentDayIndex;
        if (workoutDays[dayIndex].type === 'REST') {
            alert('วันพักไม่สามารถเพิ่มท่าได้');
            currentDayIndex = dayIndex;
            return;
        }
        const pending = Array.isArray(payload.exercises) ? payload.exercises : [];
        if (pending.length === 0) return;
        const available = MAX_EXERCISES_PER_DAY - workoutDays[dayIndex].exercises.length;
        if (available <= 0) {
            alert(`เพิ่มได้สูงสุด ${MAX_EXERCISES_PER_DAY} ท่าต่อวัน`);
            currentDayIndex = dayIndex;
            return;
        }
        const toAdd = pending.slice(0, available).map(ex => ({
            name: (ex.name || '').trim(),
            sets: ex.sets || 3,
            reps: ex.reps || '10-12'
        })).filter(ex => ex.name);
        if (toAdd.length === 0) return;
        workoutDays[dayIndex].exercises.push(...toAdd);
        if (pending.length > available) {
            alert(`เพิ่มได้สูงสุด ${MAX_EXERCISES_PER_DAY} ท่าต่อวัน`);
        }
        currentDayIndex = dayIndex;
    } catch (e) {
    } finally {
        localStorage.removeItem('planAddExercises');
    }
}

function openPlanEditModal() {
    const currentDay = workoutDays[currentDayIndex];
    if (!currentDay.exercises || currentDay.exercises.length === 0) {
        alert('ยังไม่มีท่าให้แก้ไข');
        return;
    }

    renderPlanEditList();
    const modal = new bootstrap.Modal(document.getElementById('planEditModal'));
    modal.show();
}

function renderPlanEditList() {
    const list = document.getElementById('planEditList');
    if (!list) return;
    list.innerHTML = '';

    workoutDays[currentDayIndex].exercises.forEach((exercise, idx) => {
        const row = document.createElement('div');
        row.className = 'plan-edit-row';
        row.dataset.index = idx;
        row.draggable = true;
        row.innerHTML = `
            <div class="plan-edit-drag-handle"><i class="ri-draggable"></i></div>
            <h6>${exercise.name}</h6>
            <input type="number" min="1" value="${exercise.sets}" data-field="sets" />
            <input type="text" value="${exercise.reps}" data-field="reps" />
            <div class="plan-edit-actions">
                <button type="button" data-action="up"><i class="ri-arrow-up-s-line"></i></button>
                <button type="button" data-action="down"><i class="ri-arrow-down-s-line"></i></button>
                <button type="button" class="btn-delete-small" data-action="delete"><i class="ri-delete-bin-line"></i></button>
            </div>
        `;
        list.appendChild(row);
    });

    setupDragAndDrop(list);

    // Remove old event listener first
    const newList = list.cloneNode(true);
    list.parentNode.replaceChild(newList, list);
    const updatedList = document.getElementById('planEditList');

    updatedList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const action = btn.dataset.action;
        if (!action) return;
        const row = btn.closest('.plan-edit-row');
        if (!row) return;
        const index = parseInt(row.dataset.index, 10);
        if (Number.isNaN(index)) return;

        if (action === 'up' && index > 0) {
            const temp = workoutDays[currentDayIndex].exercises[index - 1];
            workoutDays[currentDayIndex].exercises[index - 1] = workoutDays[currentDayIndex].exercises[index];
            workoutDays[currentDayIndex].exercises[index] = temp;
            renderPlanEditList();
        }

        if (action === 'down' && index < workoutDays[currentDayIndex].exercises.length - 1) {
            const temp = workoutDays[currentDayIndex].exercises[index + 1];
            workoutDays[currentDayIndex].exercises[index + 1] = workoutDays[currentDayIndex].exercises[index];
            workoutDays[currentDayIndex].exercises[index] = temp;
            renderPlanEditList();
        }

        if (action === 'delete') {
            const exerciseName = workoutDays[currentDayIndex].exercises[index]?.name || 'ท่านี้';
            showConfirmation(`ต้องการลบ "${exerciseName}" ใช่หรือไม่?`, () => {
                // Remove from data
                workoutDays[currentDayIndex].exercises.splice(index, 1);
                // Re-render the list immediately
                renderPlanEditList();
            });
        }
    }, false);
}

function setupDragAndDrop(list) {
    let draggedElement = null;
    let draggedIndex = -1;

    list.addEventListener('dragstart', (e) => {
        const row = e.target.closest('.plan-edit-row');
        if (!row) return;
        draggedElement = row;
        draggedIndex = parseInt(row.dataset.index, 10);
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    list.addEventListener('dragend', (e) => {
        const row = e.target.closest('.plan-edit-row');
        if (row) row.classList.remove('dragging');
        draggedElement = null;
        draggedIndex = -1;
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const row = e.target.closest('.plan-edit-row');
        if (!row || row === draggedElement) return;
        
        const targetIndex = parseInt(row.dataset.index, 10);
        if (Number.isNaN(targetIndex) || targetIndex === draggedIndex) return;

        const allRows = Array.from(list.querySelectorAll('.plan-edit-row'));
        allRows.forEach(r => r.classList.remove('drag-over'));
        row.classList.add('drag-over');
    });

    list.addEventListener('dragleave', (e) => {
        const row = e.target.closest('.plan-edit-row');
        if (row) row.classList.remove('drag-over');
    });

    list.addEventListener('drop', (e) => {
        e.preventDefault();
        const row = e.target.closest('.plan-edit-row');
        if (!row || row === draggedElement) return;
        
        const targetIndex = parseInt(row.dataset.index, 10);
        if (Number.isNaN(targetIndex) || targetIndex === draggedIndex) return;

        const exercises = workoutDays[currentDayIndex].exercises;
        const movedExercise = exercises.splice(draggedIndex, 1)[0];
        exercises.splice(targetIndex, 0, movedExercise);

        const allRows = Array.from(list.querySelectorAll('.plan-edit-row'));
        allRows.forEach(r => r.classList.remove('drag-over'));

        renderPlanEditList();
    });
}

function savePlanEdits() {
    const list = document.getElementById('planEditList');
    if (!list) return;
    const rows = Array.from(list.querySelectorAll('.plan-edit-row'));
    rows.forEach((row, idx) => {
        const setsInput = row.querySelector('input[data-field="sets"]');
        const repsInput = row.querySelector('input[data-field="reps"]');
        const sets = parseInt(setsInput?.value, 10);
        const reps = repsInput?.value?.trim();
        if (workoutDays[currentDayIndex].exercises[idx]) {
            workoutDays[currentDayIndex].exercises[idx].sets = sets > 0 ? sets : 1;
            workoutDays[currentDayIndex].exercises[idx].reps = reps || '10-12';
        }
    });

    const modal = bootstrap.Modal.getInstance(document.getElementById('planEditModal'));
    modal.hide();
    renderPlan();
}

// Exercise modal
function openExerciseModal(idx) {
    const exercise = workoutDays[currentDayIndex].exercises[idx];
    if (!exercise) return;

    const modalTitle = document.getElementById('exerciseModalTitle');
    const modalImage = document.getElementById('exerciseModalImage');
    const modalProgram = document.getElementById('exerciseModalProgram');
    const modalDay = document.getElementById('exerciseModalDay');
    const modalSets = document.getElementById('exerciseModalSets');
    const modalReps = document.getElementById('exerciseModalReps');

    modalTitle.textContent = exercise.name;
    modalProgram.textContent = `Type: ${workoutDays[currentDayIndex].type}`;
    modalDay.textContent = `Day: ${workoutDays[currentDayIndex].label}`;
    modalSets.textContent = `Sets: ${exercise.sets}`;
    modalReps.textContent = `Reps: ${exercise.reps}`;

    const fallbackImage = createPlaceholderImage(exercise.name);
    modalImage.src = fallbackImage;

    const modal = new bootstrap.Modal(document.getElementById('exerciseModal'));
    modal.show();
}

function openEditModal(idx) {
    currentEditingIndex = idx;
    const exercise = workoutDays[currentDayIndex].exercises[idx];

    document.getElementById('editName').value = exercise.name;
    document.getElementById('editSets').value = exercise.sets;
    document.getElementById('editReps').value = exercise.reps;

    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

function saveExercise() {
    const name = document.getElementById('editName').value.trim();
    const sets = parseInt(document.getElementById('editSets').value);
    const reps = document.getElementById('editReps').value.trim();

    if (!name || !sets || !reps) {
        alert('Please fill in all fields');
        return;
    }

    workoutDays[currentDayIndex].exercises[currentEditingIndex] = {
        name,
        sets,
        reps
    };

    const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    editModal.hide();
    renderPlan();
}

function deleteExercise(idx) {
    const exerciseName = workoutDays[currentDayIndex].exercises[idx]?.name || 'ท่านี้';
    showConfirmation(`ต้องการลบ "${exerciseName}" ใช่หรือไม่?`, () => {
        workoutDays[currentDayIndex].exercises.splice(idx, 1);
        renderPlan();
    });
}

function deleteExerciseFromModal() {
    workoutDays[currentDayIndex].exercises.splice(currentEditingIndex, 1);
    const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    editModal.hide();
    renderPlan();
}

function createPlaceholderImage(name) {
    const safeName = encodeURIComponent(name);
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
            <rect width="600" height="360" fill="#1f2125" />
            <rect x="40" y="40" width="520" height="280" fill="#35373b" rx="16" />
            <text x="300" y="190" fill="#ffffff" font-size="26" font-family="Poppins, Arial" text-anchor="middle">${safeName}</text>
            <text x="300" y="225" fill="#d1d5db" font-size="16" font-family="Poppins, Arial" text-anchor="middle">Exercise Detail</text>
        </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${svg}`;
}

// Update week display
function updateDayDisplay() {
    const dayDisplay = document.getElementById('dayDisplay');
    const currentDay = workoutDays[currentDayIndex];
    dayDisplay.textContent = `${currentDay.label}/7 • ${currentDay.type}`;
}

function previousDay() {
    if (currentDayIndex > 0) {
        currentDayIndex--;
        renderPlan();
    }
}

function nextDay() {
    if (currentDayIndex < workoutDays.length - 1) {
        currentDayIndex++;
        renderPlan();
    }
}

function downloadPlanAsImage() {
    const currentDay = workoutDays[currentDayIndex];
    const planWrapper = document.querySelector('.plan__wrapper');
    
    if (!planWrapper) return;

    // Create a temporary container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.background = 'var(--primary-color)';
    tempContainer.style.padding = '20px';
    tempContainer.style.borderRadius = '12px';
    tempContainer.style.minWidth = '600px';
    
    // Clone the plan wrapper
    const clonedPlan = planWrapper.cloneNode(true);
    
    // Remove action buttons from clone
    const headerActions = clonedPlan.querySelector('.plan__header-actions');
    if (headerActions) {
        headerActions.style.display = 'none';
    }
    
    tempContainer.appendChild(clonedPlan);
    document.body.appendChild(tempContainer);

    // Use html2canvas to convert to image
    html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#0b0d0f',
        logging: false,
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10);
        link.href = canvas.toDataURL('image/png');
        link.download = `${currentDay.type}-${currentDay.label}-${timestamp}.png`;
        link.click();
        
        // Clean up
        document.body.removeChild(tempContainer);
    }).catch(error => {
        console.error('Error downloading image:', error);
        alert('เกิดข้อผิดพลาดในการดาวโหลดรูปภาพ');
        document.body.removeChild(tempContainer);
    });
}

function setupGridDragAndDrop() {
    const planGrid = document.getElementById('planGrid');
    if (!planGrid) return;

    let draggedCell = null;
    let draggedIndex = -1;

    const cells = planGrid.querySelectorAll('.plan__cell:not(.plan__cell-placeholder):not(.plan__cell-empty)');

    cells.forEach(cell => {
        cell.addEventListener('dragstart', (e) => {
            draggedCell = cell;
            draggedIndex = parseInt(cell.dataset.exerciseIndex, 10);
            cell.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', cell.innerHTML);
        });

        cell.addEventListener('dragend', (e) => {
            if (draggedCell) {
                draggedCell.classList.remove('dragging');
            }
            cells.forEach(c => c.classList.remove('drag-over'));
            draggedCell = null;
            draggedIndex = -1;
        });

        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (cell !== draggedCell) {
                cell.classList.add('drag-over');
            }
        });

        cell.addEventListener('dragleave', (e) => {
            if (e.target === cell) {
                cell.classList.remove('drag-over');
            }
        });

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedCell && cell !== draggedCell) {
                const targetIndex = parseInt(cell.dataset.exerciseIndex, 10);
                if (!Number.isNaN(draggedIndex) && !Number.isNaN(targetIndex)) {
                    const currentDay = workoutDays[currentDayIndex];
                    const movedExercise = currentDay.exercises.splice(draggedIndex, 1)[0];
                    currentDay.exercises.splice(targetIndex, 0, movedExercise);
                    renderPlan();
                }
            }
            cells.forEach(c => c.classList.remove('drag-over'));
        });
    });
}

// Open bulk edit modal for editing day names and sets
function openBulkEditModal() {
    const planEditList = document.getElementById('planEditList');
    if (!planEditList) return;

    planEditList.innerHTML = '';

    const dayOptions = ['PUSH', 'PULL', 'LEG & SHOULDER', 'REST', 'CARDIO'];

    workoutDays.forEach((day, dayIndex) => {
        const editItem = document.createElement('div');
        editItem.className = 'plan-edit-item';
        
        const optionsHTML = dayOptions.map(option => 
            `<option value="${option}" ${day.label === option ? 'selected' : ''}>${option}</option>`
        ).join('');
        
        editItem.innerHTML = `
            <div class="plan-edit-item__header">
                <label>ชื่อวัน</label>
                <select class="plan-edit-item__input plan-edit-item__name" data-day-index="${dayIndex}">
                    ${optionsHTML}
                </select>
            </div>
        `;
        planEditList.appendChild(editItem);
    });

    const planEditModal = new bootstrap.Modal(document.getElementById('planEditModal'));
    planEditModal.show();
}

// Subtitle mapping for each day type
const subtitleMap = {
    'PUSH': 'Chest • Shoulder • Triceps',
    'PULL': 'Back • Biceps',
    'LEG & SHOULDER': 'Leg • Shoulder',
    'CARDIO': 'Cardio • Endurance',
    'REST': 'Recovery'
};

// Save bulk edits
document.addEventListener('DOMContentLoaded', function () {
    const savePlanEditBtn = document.getElementById('savePlanEditBtn');
    if (savePlanEditBtn) {
        savePlanEditBtn.addEventListener('click', function () {
            document.querySelectorAll('.plan-edit-item__name').forEach(input => {
                const dayIndex = parseInt(input.dataset.dayIndex);
                const newName = input.value.trim();
                if (newName) {
                    workoutDays[dayIndex].label = newName;
                    // อัปเดต subtitle ตามประเภทวันที่เลือก
                    workoutDays[dayIndex].subtitle = subtitleMap[newName] || 'Unknown';
                }
            });

            savePlansToLocalStorage();
            renderAllDays();

            const planEditModal = bootstrap.Modal.getInstance(document.getElementById('planEditModal'));
            if (planEditModal) {
                planEditModal.hide();
            }
        });
    }
}, { once: true });

