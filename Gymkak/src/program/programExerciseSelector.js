// Program Exercise Selector - Adds "Add" buttons to exercises and handles selection
(function() {
    'use strict';
    
    console.log('🎯 programExerciseSelector.js loaded');
    
    // Maximum exercises per day (dynamic based on mode)
    let MAX_EXERCISES_PER_DAY = 12;
    
    // Store selected exercises for current session
    let selectedExercises = [];
    
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
    
    // Get dayIndex from URL parameters
    function getDayIndexFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const dayIndex = urlParams.get('dayIndex');
        console.log('📌 dayIndex from URL:', dayIndex);
        return dayIndex !== null ? parseInt(dayIndex, 10) : null;
    }
    
    // Get current exercise count for the day from localStorage
    function getCurrentExerciseCount(dayIndex) {
        try {
            const userKey = getUserStorageKey('workoutPlan');
            const saved = localStorage.getItem(userKey);
            if (saved) {
                const plan = JSON.parse(saved);
                if (plan[dayIndex] && Array.isArray(plan[dayIndex].exercises)) {
                    return plan[dayIndex].exercises.length;
                }
            }
        } catch (e) {
            console.error('Error reading workout plan:', e);
        }
        return 0;
    }
    
    // Initialize when DOM is ready
    function init() {
        const dayIndex = getDayIndexFromURL();
        
        // Check if coming from strength records
        const isFromStrengthRecords = sessionStorage.getItem('addExerciseFromStrengthRecords') === 'true';
        
        if (isFromStrengthRecords) {
            console.log('💪 Coming from Strength Records - showing exercise selection mode');
            MAX_EXERCISES_PER_DAY = 8;
            showStrengthRecordsExerciseSelection();
            return;
        }
        
        // Check if coming from dashboard
        const isFromDashboard = sessionStorage.getItem('addExerciseFromDashboard') === 'true';
        
        if (isFromDashboard) {
            console.log('📱 Coming from Dashboard - showing exercise selection mode');
            MAX_EXERCISES_PER_DAY = 12;
            showDashboardExerciseSelection();
            return;
        }
        
        if (dayIndex === null) {
            console.log('ℹ️ No dayIndex parameter - not in selection mode');
            return;
        }
        
        console.log(`✅ Selection mode active for day ${dayIndex}`);
        
        // Load previously selected exercises from sessionStorage
        const sessionKey = `tempSelectedExercises_day${dayIndex}`;
        const savedSelection = sessionStorage.getItem(sessionKey);
        if (savedSelection) {
            try {
                selectedExercises = JSON.parse(savedSelection);
                console.log('📋 Loaded previous selections:', selectedExercises);
            } catch (e) {
                selectedExercises = [];
            }
        }
        
        // Show notification banner
        showSelectionModeBanner(dayIndex);
        
        // Add "Add" buttons to all exercises
        addExerciseSelectionButtons(dayIndex);
        
        // Update counter
        updateExerciseCounter(dayIndex);
    }
    
    // Show dashboard exercise selection UI
    function showDashboardExerciseSelection() {
        const tempKey = 'tempDashboardSelectedExercises';
        const saved = sessionStorage.getItem(tempKey);
        if (saved) {
            try {
                selectedExercises = JSON.parse(saved);
            } catch (e) {
                selectedExercises = [];
            }
        }

        const banner = document.createElement('div');
        banner.id = 'dashboardSelectionBanner';
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(12, 14, 18, 0.95);
            color: var(--white);
            padding: 0.9rem 1.1rem;
            border-radius: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.9rem;
            font-size: 0.92rem;
            border: 1px solid rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(10px);
            max-width: 90%;
        `;
        
        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                <i class="ri-add-circle-line" style="font-size: 1.15rem; color: #4dd6ff;"></i>
                <span id="dashboardExerciseCounter" style="background: rgba(77, 214, 255, 0.12); border: 1px solid rgba(77, 214, 255, 0.3); padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.82rem; font-weight: 600; color: #83e3ff;">0/12 ท่า</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <button id="dashboardCancelBtn" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.35); color: #e6eef5; padding: 0.48rem 1rem; border-radius: 999px; cursor: pointer; font-size: 0.82rem; font-weight: 600; white-space: nowrap;">
                    ยกเลิก
                </button>
                <button id="dashboardSaveBtn" style="background: #2ca9d4; border: 1px solid #2ca9d4; color: #ffffff; padding: 0.5rem 1.15rem; border-radius: 999px; cursor: pointer; font-size: 0.82rem; font-weight: 700; white-space: nowrap;">
                    บันทึก
                </button>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Add event listeners
        document.getElementById('dashboardCancelBtn').addEventListener('click', () => {
            sessionStorage.removeItem(tempKey);
            sessionStorage.removeItem('addExerciseFromDashboard');
            sessionStorage.removeItem('workoutCategory');
            window.location.href = '/Gymkak/src/dashboard/dashboard.html';
        });

        document.getElementById('dashboardSaveBtn').addEventListener('click', saveDashboardSelectionAndReturn);
        
        // Add "เพิ่มท่า" buttons as secondary actions while keeping Details
        addDashboardExerciseButtons();
        updateDashboardSelectionCounter();
    }
    
    // Add exercise selection buttons for dashboard mode
    function addDashboardExerciseButtons() {
        const exerciseItems = document.querySelectorAll('.exercise-item');
        
        exerciseItems.forEach((item) => {
            const exerciseName = item.querySelector('.exercise-name');
            const actions = item.querySelector('.exercise-actions');
            
            if (!exerciseName || !actions) return;
            
            const name = exerciseName.textContent.trim();

            let addBtn = actions.querySelector('.btn-add-exercise-dashboard');
            if (!addBtn) {
                addBtn = document.createElement('button');
                addBtn.className = 'btn-add-exercise-dashboard';
                addBtn.type = 'button';
                addBtn.dataset.exerciseName = name;
                addBtn.style.cssText = `
                    margin-left: 0.6rem;
                    background: transparent;
                    border: 1px solid #29b7e6;
                    color: #29b7e6;
                    padding: 0.5rem 1rem;
                    border-radius: 999px;
                    cursor: pointer;
                    font-size: 0.82rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                `;
                actions.appendChild(addBtn);
            }
            
            const isSelected = selectedExercises.includes(name);
            applyDashboardAddButtonState(addBtn, isSelected);

            if (!addBtn.__dashboardBound) {
                addBtn.__dashboardBound = true;
                addBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleDashboardExerciseSelection(this.dataset.exerciseName, this);
                });
            }
        });
    }
    
    function applyDashboardAddButtonState(button, isSelected) {
        if (isSelected) {
            button.textContent = 'เลือกแล้ว';
            button.style.background = 'rgba(41, 183, 230, 0.12)';
            button.style.color = '#8be7ff';
            button.style.borderColor = '#49c7ef';
        } else {
            button.textContent = 'เพิ่มท่า';
            button.style.background = 'transparent';
            button.style.color = '#29b7e6';
            button.style.borderColor = '#29b7e6';
        }
    }

    function toggleDashboardExerciseSelection(exerciseName, button) {
        const index = selectedExercises.indexOf(exerciseName);
        if (index !== -1) {
            selectedExercises.splice(index, 1);
            applyDashboardAddButtonState(button, false);
            sessionStorage.setItem('tempDashboardSelectedExercises', JSON.stringify(selectedExercises));
            updateDashboardSelectionCounter();
            return;
        }

        if (selectedExercises.length >= MAX_EXERCISES_PER_DAY) {
            alert(`เลือกได้สูงสุด ${MAX_EXERCISES_PER_DAY} ท่า`);
            return;
        }

        selectedExercises.push(exerciseName);
        applyDashboardAddButtonState(button, true);
        sessionStorage.setItem('tempDashboardSelectedExercises', JSON.stringify(selectedExercises));
        updateDashboardSelectionCounter();
    }

    function updateDashboardSelectionCounter() {
        const counter = document.getElementById('dashboardExerciseCounter');
        const saveBtn = document.getElementById('dashboardSaveBtn');

        if (counter) {
            counter.textContent = `${selectedExercises.length}/${MAX_EXERCISES_PER_DAY} ท่า`;
        }

        if (saveBtn) {
            const disabled = selectedExercises.length === 0;
            saveBtn.disabled = disabled;
            saveBtn.style.opacity = disabled ? '0.5' : '1';
            saveBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
    }

    function saveDashboardSelectionAndReturn() {
        if (selectedExercises.length === 0) {
            return;
        }

        const payload = {
            items: selectedExercises.map(name => ({
                exerciseName: name,
                sets: 3
            })),
            timestamp: Date.now()
        };

        sessionStorage.setItem('dashboardExerciseSelected', JSON.stringify(payload));
        sessionStorage.removeItem('tempDashboardSelectedExercises');
        sessionStorage.removeItem('addExerciseFromDashboard');
        sessionStorage.removeItem('workoutCategory');

        window.location.href = '/Gymkak/src/dashboard/dashboard.html';
    }
    
    // Show banner to indicate selection mode
    function showSelectionModeBanner(dayIndex) {
        const banner = document.createElement('div');
        banner.id = 'selectionModeBanner';
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: var(--white);
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.95rem;
            border: 1px solid rgba(255,140,66,0.3);
            backdrop-filter: blur(10px);
            max-width: 90%;
        `;
        
        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                <i class="ri-add-circle-line" style="font-size: 1.3rem; color: #ff8c42;"></i>
                <span id="exerciseCounter" style="background: rgba(255,140,66,0.2); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; font-weight: 600; color: #ff8c42;">0/12 ท่า</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <button id="cancelPlanBtn" style="background: rgba(255,140,66,0.2); border: 1px solid #ff8c42; color: #ff8c42; padding: 0.5rem 1.2rem; border-radius: 20px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.3s; white-space: nowrap;">
                    ยกเลิก
                </button>
                <button id="savePlanBtn" style="background: #ff8c42; border: none; color: white; padding: 0.6rem 1.5rem; border-radius: 20px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.3s; white-space: nowrap; box-shadow: 0 2px 8px rgba(255,140,66,0.3);">
                    <i class="ri-save-line" style="margin-right: 0.3rem;"></i>บันทึก
                </button>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Add event listeners
        document.getElementById('savePlanBtn').addEventListener('click', () => saveAndReturn(dayIndex));
        document.getElementById('cancelPlanBtn').addEventListener('click', () => cancelSelection(dayIndex));
    }
    
    // Update exercise counter display
    function updateExerciseCounter(dayIndex) {
        const counter = document.getElementById('exerciseCounter');
        const saveBtn = document.getElementById('savePlanBtn');
        if (!counter) return;
        
        const currentCount = getCurrentExerciseCount(dayIndex);
        const selectedCount = selectedExercises.length;
        const totalCount = currentCount + selectedCount;
        
        counter.textContent = `${selectedCount}/${MAX_EXERCISES_PER_DAY} ท่า`;
        
        // Update counter color based on limit
        if (totalCount >= MAX_EXERCISES_PER_DAY) {
            counter.style.background = 'rgba(255,76,76,0.2)';
            counter.style.color = '#ff4c4c';
        } else {
            counter.style.background = 'rgba(255,140,66,0.2)';
            counter.style.color = '#ff8c42';
        }
        
        // Disable save button if no exercises selected
        if (saveBtn) {
            if (selectedCount === 0) {
                saveBtn.style.opacity = '0.5';
                saveBtn.style.cursor = 'not-allowed';
                saveBtn.disabled = true;
            } else {
                saveBtn.style.opacity = '1';
                saveBtn.style.cursor = 'pointer';
                saveBtn.disabled = false;
            }
        }
    }
    
    // Save and return to plans page
    function saveAndReturn(dayIndex) {
        if (selectedExercises.length === 0) {
            return;
        }
        
        console.log('💾 Saving exercises:', selectedExercises);
        
        // Save all selected exercises to localStorage with user-specific key
        selectedExercises.forEach((exerciseName, index) => {
            const baseKey = `selectedExercise_day${dayIndex}_${index}`;
            const userKey = getUserStorageKey(baseKey);
            const exerciseData = {
                name: exerciseName,
                timestamp: Date.now()
            };
            localStorage.setItem(userKey, JSON.stringify(exerciseData));
            console.log(`✅ Saved: ${userKey} = ${exerciseName}`);
        });
        
        // Clear session storage
        sessionStorage.removeItem(`tempSelectedExercises_day${dayIndex}`);
        
        // Navigate back to plans page
        window.location.href = '/Gymkak/src/user/plans/plans.html';
    }
    
    // Cancel selection and return
    function cancelSelection(dayIndex) {
        // Clear temporary selections
        sessionStorage.removeItem(`tempSelectedExercises_day${dayIndex}`);
        selectedExercises = [];
        
        // Go back
        window.history.back();
    }
    
    // Add "Add" buttons to all exercise items
    function addExerciseSelectionButtons(dayIndex) {
        const exerciseItems = document.querySelectorAll('.exercise-item');
        console.log(`📝 Found ${exerciseItems.length} exercise items`);
        
        exerciseItems.forEach((item, index) => {
            // Get exercise name
            const nameElement = item.querySelector('.exercise-name');
            if (!nameElement) {
                console.warn(`⚠️ Exercise ${index} has no name element`);
                return;
            }
            
            const exerciseName = nameElement.textContent.trim();
            console.log(`  - Exercise ${index}: ${exerciseName}`);
            
            // Find the exercise actions container
            let actionsContainer = item.querySelector('.exercise-actions');
            
            if (!actionsContainer) {
                console.warn(`⚠️ Exercise ${index} has no actions container`);
                return;
            }
            
            // Check if button already exists
            if (actionsContainer.querySelector('.btn-add-to-plan')) {
                return;
            }
            
            // Create Add button (same style as btn-details)
            const addButton = document.createElement('button');
            addButton.className = 'btn-add-to-plan';
            addButton.textContent = 'เพิ่ม';
            addButton.dataset.exerciseName = exerciseName;
            
            // Check if already selected
            if (selectedExercises.includes(exerciseName)) {
                addButton.textContent = '✓ เลือกแล้ว';
                addButton.style.opacity = '0.85';
                addButton.style.cursor = 'pointer';
            }
            
            // Add click handler
            addButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                addExerciseToPlan(dayIndex, exerciseName, this);
            });
            
            // Add button to container
            actionsContainer.appendChild(addButton);
        });
    }
    
    // Add exercise to plan (toggle: click again to deselect)
    function addExerciseToPlan(dayIndex, exerciseName, button) {
        console.log(`🔁 Toggle exercise: ${exerciseName} (day ${dayIndex})`);

        // If already selected, clicking again means deselect
        if (selectedExercises.includes(exerciseName)) {
            selectedExercises = selectedExercises.filter(name => name !== exerciseName);

            const sessionKey = `tempSelectedExercises_day${dayIndex}`;
            sessionStorage.setItem(sessionKey, JSON.stringify(selectedExercises));

            button.textContent = 'เพิ่ม';
            button.style.opacity = '1';
            button.style.cursor = 'pointer';

            updateExerciseCounter(dayIndex);
            console.log('➖ Deselected. Current selections:', selectedExercises);
            return;
        }
        
        // Check maximum limit
        const currentCount = getCurrentExerciseCount(dayIndex);
        const totalCount = currentCount + selectedExercises.length;
        
        if (totalCount >= MAX_EXERCISES_PER_DAY) {
            // Show alert
            alert(`ไม่สามารถเพิ่มท่าได้เกิน ${MAX_EXERCISES_PER_DAY} ท่าต่อวัน`);
            return;
        }
        
        // Add to selected list
        selectedExercises.push(exerciseName);
        
        // Save to session storage
        const sessionKey = `tempSelectedExercises_day${dayIndex}`;
        sessionStorage.setItem(sessionKey, JSON.stringify(selectedExercises));
        
        // Show selected state (keep clickable for deselect)
        showSuccessFeedback(button, exerciseName);
        
        // Update counter
        updateExerciseCounter(dayIndex);
        
        console.log('Current selections:', selectedExercises);
    }
    
    // Show success feedback animation
    function showSuccessFeedback(button, exerciseName) {
        // Change button text to success state
        button.textContent = '✓ เลือกแล้ว';
        button.style.opacity = '0.85';
        button.style.cursor = 'pointer';
    }

    // Show strength records exercise selection UI
    function showStrengthRecordsExerciseSelection() {
        const tempKey = 'tempStrengthRecordsSelectedExercises';
        const saved = sessionStorage.getItem(tempKey);
        if (saved) {
            try {
                selectedExercises = JSON.parse(saved);
            } catch (e) {
                selectedExercises = [];
            }
        }

        const banner = document.createElement('div');
        banner.id = 'strengthRecordsSelectionBanner';
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(12, 14, 18, 0.95);
            color: var(--white);
            padding: 0.9rem 1.1rem;
            border-radius: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.9rem;
            font-size: 0.92rem;
            border: 1px solid rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(10px);
            max-width: 90%;
        `;
        
        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                <i class="ri-add-circle-line" style="font-size: 1.15rem; color: #a78bfa;"></i>
                <span id="strengthRecordsExerciseCounter" style="background: rgba(167, 139, 250, 0.12); border: 1px solid rgba(167, 139, 250, 0.3); padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.82rem; font-weight: 600; color: #d8b4fe;">0/8 ท่า</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <button id="strengthRecordsCancelBtn" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.35); color: #e6eef5; padding: 0.48rem 1rem; border-radius: 999px; cursor: pointer; font-size: 0.82rem; font-weight: 600; white-space: nowrap;">
                    ยกเลิก
                </button>
                <button id="strengthRecordsSaveBtn" style="background: #a78bfa; border: 1px solid #a78bfa; color: #ffffff; padding: 0.5rem 1.15rem; border-radius: 999px; cursor: pointer; font-size: 0.82rem; font-weight: 700; white-space: nowrap;">
                    บันทึก
                </button>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Add event listeners
        document.getElementById('strengthRecordsCancelBtn').addEventListener('click', () => {
            sessionStorage.removeItem(tempKey);
            sessionStorage.removeItem('addExerciseFromStrengthRecords');
            sessionStorage.removeItem('workoutCategory');
            window.location.href = '/Gymkak/src/dashboard/dashboard.html';
        });

        document.getElementById('strengthRecordsSaveBtn').addEventListener('click', saveStrengthRecordsSelectionAndReturn);
        
        // Add "เพิ่มท่า" buttons as secondary actions while keeping Details
        addStrengthRecordsExerciseButtons();
        updateStrengthRecordsSelectionCounter();
    }
    
    // Add exercise selection buttons for strength records mode
    function addStrengthRecordsExerciseButtons() {
        const exerciseItems = document.querySelectorAll('.exercise-item');
        
        exerciseItems.forEach((item) => {
            const exerciseName = item.querySelector('.exercise-name');
            const actions = item.querySelector('.exercise-actions');
            
            if (!exerciseName || !actions) return;
            
            const name = exerciseName.textContent.trim();
            
            // Extract exercise data from the item element
            const exerciseData = {
                name: name,
                _id: item.dataset.exerciseId || name, // Use data attribute or name as fallback
                level: item.dataset.level || '',
                targetMuscle: item.dataset.targetMuscle || '',
                equipment: item.dataset.equipment || ''
            };

            let addBtn = actions.querySelector('.btn-add-exercise-strength');
            if (!addBtn) {
                addBtn = document.createElement('button');
                addBtn.className = 'btn-add-exercise-strength';
                addBtn.type = 'button';
                addBtn.dataset.exerciseName = name;
                addBtn.dataset.exerciseData = JSON.stringify(exerciseData);
                addBtn.style.cssText = `
                    margin-left: 0.6rem;
                    background: transparent;
                    border: 1px solid #a78bfa;
                    color: #a78bfa;
                    padding: 0.5rem 1rem;
                    border-radius: 999px;
                    cursor: pointer;
                    font-size: 0.82rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                `;
                actions.appendChild(addBtn);
            }
            
            const isSelected = selectedExercises.some(ex => {
                const exName = typeof ex === 'string' ? ex : ex.name;
                return exName === name;
            });
            applyStrengthRecordsAddButtonState(addBtn, isSelected);

            if (!addBtn.__strengthBound) {
                addBtn.__strengthBound = true;
                addBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const data = JSON.parse(this.dataset.exerciseData || '{}');
                    toggleStrengthRecordsExerciseSelection(data, this);
                });
            }
        });
    }
    
    function applyStrengthRecordsAddButtonState(button, isSelected) {
        if (isSelected) {
            button.textContent = 'เลือกแล้ว';
            button.style.background = 'rgba(167, 139, 250, 0.12)';
            button.style.color = '#d8b4fe';
            button.style.borderColor = '#c4b5fd';
        } else {
            button.textContent = 'เพิ่มท่า';
            button.style.background = 'transparent';
            button.style.color = '#a78bfa';
            button.style.borderColor = '#a78bfa';
        }
    }

    function toggleStrengthRecordsExerciseSelection(exerciseData, button) {
        const exerciseName = exerciseData.name || exerciseData;
        const index = selectedExercises.findIndex(ex => {
            const exName = typeof ex === 'string' ? ex : ex.name;
            return exName === exerciseName;
        });
        
        if (index !== -1) {
            selectedExercises.splice(index, 1);
            applyStrengthRecordsAddButtonState(button, false);
            sessionStorage.setItem('tempStrengthRecordsSelectedExercises', JSON.stringify(selectedExercises));
            updateStrengthRecordsSelectionCounter();
            return;
        }

        if (selectedExercises.length >= MAX_EXERCISES_PER_DAY) {
            alert(`เลือกได้สูงสุด ${MAX_EXERCISES_PER_DAY} ท่า`);
            return;
        }

        // Store full exercise object
        selectedExercises.push(exerciseData);
        applyStrengthRecordsAddButtonState(button, true);
        sessionStorage.setItem('tempStrengthRecordsSelectedExercises', JSON.stringify(selectedExercises));
        updateStrengthRecordsSelectionCounter();
    }

    function updateStrengthRecordsSelectionCounter() {
        const counter = document.getElementById('strengthRecordsExerciseCounter');
        const saveBtn = document.getElementById('strengthRecordsSaveBtn');

        if (counter) {
            counter.textContent = `${selectedExercises.length}/${MAX_EXERCISES_PER_DAY} ท่า`;
        }

        if (saveBtn) {
            const disabled = selectedExercises.length === 0;
            saveBtn.disabled = disabled;
            saveBtn.style.opacity = disabled ? '0.5' : '1';
            saveBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
    }

    function saveStrengthRecordsSelectionAndReturn() {
        if (selectedExercises.length === 0) {
            return;
        }

        const payload = {
            items: selectedExercises.map(exercise => {
                // Handle both object and string formats
                if (typeof exercise === 'string') {
                    return { name: exercise, exerciseName: exercise };
                }
                return {
                    name: exercise.name,
                    exerciseName: exercise.name,
                    _id: exercise._id,
                    level: exercise.level,
                    targetMuscle: exercise.targetMuscle,
                    equipment: exercise.equipment
                };
            }),
            timestamp: Date.now()
        };

        sessionStorage.setItem('strengthRecordsExerciseSelected', JSON.stringify(payload));
        sessionStorage.removeItem('tempStrengthRecordsSelectedExercises');
        sessionStorage.removeItem('addExerciseFromStrengthRecords');
        sessionStorage.removeItem('workoutCategory');

        window.location.href = '/Gymkak/src/dashboard/dashboard.html';
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
