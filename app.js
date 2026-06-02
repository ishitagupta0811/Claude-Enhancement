document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mobileMenuTrigger = document.getElementById('mobileMenuTrigger');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  const mainWorkspace = document.getElementById('mainWorkspace');
  const scrollContainer = document.getElementById('scrollContainer');
  const landingContainer = document.getElementById('landingContainer');
  const chatThreadContainer = document.getElementById('chatThreadContainer');
  const newChatNavBtn = document.getElementById('newChatNavBtn');

  const chatTextArea = document.getElementById('chatTextArea');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const attachBtn = document.getElementById('attachBtn');
  const attachmentContainer = document.getElementById('attachmentContainer');

  const modelSelectorBtn = document.getElementById('modelSelectorBtn');
  const modelSelectorContainer = document.getElementById('modelSelectorContainer');
  const modelDropdown = document.getElementById('modelDropdown');
  const activeModelLabel = document.getElementById('activeModelLabel');
  const modelOptions = document.querySelectorAll('.model-option');

  const voiceDictationBtn = document.getElementById('voiceDictationBtn');
  const voiceReadoutBtn = document.getElementById('voiceReadoutBtn');
  const recordingBar = document.getElementById('recordingBar');
  const recordingCancelBtn = document.getElementById('recordingCancelBtn');

  const voicePlayer = document.getElementById('voicePlayer');
  const voicePlayBtn = document.getElementById('voicePlayBtn');
  const voiceWaveform = document.getElementById('voiceWaveform');
  const voiceTime = document.getElementById('voiceTime');
  const playSvg = document.getElementById('playSvg');
  const pauseSvg = document.getElementById('pauseSvg');

  const profileToggle = document.getElementById('profileToggle');
  const profileMenu = document.getElementById('profileMenu');

  const suggestionsRow = document.getElementById('suggestionsRow');
  const suggestionPills = document.querySelectorAll('.suggestion-pill');
  const drivePill = document.getElementById('drivePill');

  const driveModal = document.getElementById('driveModal');
  const driveCloseBtn = document.getElementById('driveCloseBtn');
  const driveFileItems = document.querySelectorAll('.drive-file-item');
  const historyLinks = document.querySelectorAll('.history-link');

  // Case Study Setup Pop-up Card Elements
  const casePopupCard = document.getElementById('casePopupCard');
  const popupTitle = document.getElementById('popupTitle');
  const popupProgress = document.getElementById('popupProgress');
  const popupOptionList = document.getElementById('popupOptionList');
  const popupCloseBtn = document.getElementById('popupCloseBtn');

  // Onboarding Portal Elements
  const onboardingPortal = document.getElementById('onboardingPortal');
  const onboardingNameInput = document.getElementById('onboardingNameInput');
  const onboardingSubmitBtn = document.getElementById('onboardingSubmitBtn');
  const onboardingError = document.getElementById('onboardingError');

  // Hidden File Input for local file attachments
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  // State Variables
  let activeModel = 'Opus 4.8 Extra';
  let conversationHistory = [];
  let userName = '';
  let userInitials = '';
  let attachments = [];
  let dictationInterval = null;
  let isVoicePlaying = false;
  let voiceTimerInterval = null;
  let voiceDurationSeconds = 14;
  let voiceCurrentSeconds = 14;

  // Case Study Wizard State
  let currentPopupIndex = 1;
  let selectedCaseType = '';
  let selectedSector = '';

  // Active Response Generation State
  let activeChatAbortController = null;
  let isGeneratingResponse = false;

  const deepLaneQuestions = {
    1: {
      title: 'Where are you in the journey right now?',
      progress: '< 1 of 2 >',
      options: [
        { label: 'Just an idea so far', value: 'Just an idea so far' },
        { label: 'Building the MVP', value: 'Building the MVP' },
        { label: 'Launched, getting first users', value: 'Launched, getting first users' },
        { label: 'Have users, want to grow', value: 'Have users, want to grow' }
      ],
      customOption: 'Something else'
    },
    2: {
      title: 'What is your primary focus for optimizing the support queue?',
      progress: '< 2 of 2 >',
      options: [
        { label: 'Reducing initial response times', value: 'Reducing initial response times' },
        { label: 'Deflecting tickets with automated AI', value: 'Deflecting tickets with automated AI' },
        { label: 'Improving CSAT and SLA breaches', value: 'Improving CSAT and SLA breaches' },
        { label: 'Streamlining agent onboarding tools', value: 'Streamlining agent onboarding tools' }
      ],
      customOption: 'Something else'
    }
  };

  // Onboarding & Personalization Logic
  function computeInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length > 0 && parts[0]) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return "ME";
  }

  function applyUserName(name) {
    userName = name;
    userInitials = computeInitials(name);

    // 1. Sidebar bottom avatar
    const sidebarAvatarCircle = document.querySelector('.avatar-circle');
    if (sidebarAvatarCircle) sidebarAvatarCircle.textContent = userInitials;

    // 2. Sidebar profile text
    const sidebarNameSpan = document.querySelector('.avatar-text');
    if (sidebarNameSpan) sidebarNameSpan.textContent = userName;

    // 3. Profile popover settings name & dynamic email
    const profileNameDiv = document.querySelector('.profile-name');
    if (profileNameDiv) profileNameDiv.textContent = userName;

    const profileEmailDiv = document.querySelector('.profile-email');
    if (profileEmailDiv) {
      profileEmailDiv.textContent = userName.toLowerCase().replace(/\s+/g, '.') + '@example.com';
    }

    // 4. Landing page greeting (time-sensitive)
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";

    const greetingTitle = document.querySelector('.greeting-title');
    if (greetingTitle) {
      greetingTitle.textContent = `${greeting}, ${userName}`;
    }

    // 5. Browser page tab title
    document.title = `Claude - ${greeting}, ${userName}`;
  }

  function initOnboarding() {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      onboardingPortal.style.display = 'none';
      applyUserName(savedName);
    } else {
      onboardingPortal.style.display = 'flex';
      onboardingNameInput.focus();
    }
  }

  function submitOnboardingName() {
    const inputVal = onboardingNameInput.value.trim();
    if (!inputVal) {
      onboardingError.classList.add('show');
      return;
    }

    onboardingError.classList.remove('show');
    localStorage.setItem('userName', inputVal);
    applyUserName(inputVal);

    // Smooth transition fade-out
    onboardingPortal.classList.add('fade-out');
    setTimeout(() => {
      onboardingPortal.style.display = 'none';
    }, 500);
  }

  onboardingSubmitBtn.addEventListener('click', submitOnboardingName);
  onboardingNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      submitOnboardingName();
    }
  });

  // Call onboarding checks
  initOnboarding();

  // --- Premium Universal Tooltip Manager ---
  let activeTooltip = null;

  document.body.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tooltip]');
    if (!target) return;

    // Avoid displaying tooltip on input fields when typing
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;

    const tooltipText = target.getAttribute('data-tooltip') || 'Coming soon';
    const isComingSoon = target.getAttribute('data-coming-soon') === 'true';

    // Remove existing tooltip if any
    hideTooltip();

    // Create tooltip container
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';

    let headerText = tooltipText;
    let bodyText = "";

    if (isComingSoon) {
      tooltip.classList.add('coming-soon-tooltip');
      bodyText = "This feature is currently in development and will be available in a future update.";

      tooltip.innerHTML = `
        <div class="custom-tooltip-header">
          <span>${escapeHtml(headerText)}</span>
          <span class="custom-tooltip-badge">Coming Soon</span>
        </div>
        <div class="custom-tooltip-body">${escapeHtml(bodyText)}</div>
      `;
    } else {
      tooltip.innerHTML = `
        <div class="custom-tooltip-header">
          <span>${escapeHtml(headerText)}</span>
        </div>
      `;
    }

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

    // Position tooltip relative to target element
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Default position: top centered above the element
    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;

    // Check position overrides or smart boundaries
    const isSidebarCollapsed = sidebar && !sidebar.classList.contains('expanded');
    const isSidebarItem = target.closest('.sidebar');

    if (isSidebarItem && isSidebarCollapsed) {
      // Position to the right when sidebar is collapsed
      top = rect.top + (rect.height - tooltipRect.height) / 2;
      left = rect.right + 8;
    } else if (target.classList.contains('msg-feedback-btn')) {
      // Position feedback buttons above them
      top = rect.top - tooltipRect.height - 8;
      left = rect.left + (rect.width - tooltipRect.width) / 2;
    }

    // Boundary checks (prevent escaping screen edges)
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
      // If escaping top, show below the element
      top = rect.bottom + 8;
    }

    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left + window.scrollX}px`;

    // Trigger smooth fade in animation
    requestAnimationFrame(() => {
      tooltip.classList.add('show');
    });
  });

  document.body.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-tooltip]');
    if (target) {
      hideTooltip();
    }
  });

  document.body.addEventListener('click', (e) => {
    const target = e.target.closest('[data-coming-soon="true"]');
    if (target) {
      e.preventDefault();
      e.stopPropagation();

      // Subtle micro-animation to indicate disabled element
      target.classList.add('shake-anim');
      setTimeout(() => {
        target.classList.remove('shake-anim');
      }, 300);
    }
  }, true); // Use capture phase to intercept click before other handlers

  function hideTooltip() {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  function renderDeepLaneQuestion(strategyCard, index = 1, answers = {}) {
    let questionsList = [];
    try {
      questionsList = JSON.parse(strategyCard.getAttribute('data-questions'));
    } catch (e) {
      questionsList = [
        {
          title: "Where are you in the journey right now?",
          options: ["Just an idea so far", "Building the MVP", "Launched, getting first users", "Have users, want to grow"]
        },
        {
          title: "What is your primary focus for optimizing this strategy?",
          options: ["Reducing initial customer acquisition cost", "Improving retention and engagement", "Expanding to B2B segments", "Maximizing monetization and pricing loops"]
        }
      ];
    }

    const qData = questionsList[index - 1];
    if (!qData) return;

    // Get or create the deeplane view
    let deeplaneView = strategyCard.querySelector('.strategy-deeplane-view');
    if (!deeplaneView) {
      deeplaneView = document.createElement('div');
      deeplaneView.className = 'strategy-deeplane-view';
      deeplaneView.style.flexDirection = 'column';
      deeplaneView.style.display = 'none';
      strategyCard.appendChild(deeplaneView);
    }

    // Hide selection and fastlane views
    strategyCard.querySelector('.strategy-selection-view').style.display = 'none';
    const fastlaneView = strategyCard.querySelector('.strategy-fastlane-view');
    if (fastlaneView) fastlaneView.style.display = 'none';

    deeplaneView.style.display = 'flex';

    // Populate deeplaneView HTML to perfectly cover assumptions section
    deeplaneView.innerHTML = `
      <div class="popup-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.04); padding-bottom: 10px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 10px; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <button class="deeplane-back-btn" style="background: none; border: none; color: var(--text-muted); font-size: 11.5px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 3px; padding: 2px;">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            <span>Back</span>
          </button>
          <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">&lt; ${index} of ${questionsList.length} &gt;</span>
        </div>
        <span class="popup-title" style="font-size: 15px; font-weight: 500; color: var(--text-primary); line-height: 1.4;">${qData.title}</span>
      </div>
      <div class="popup-option-list deeplane-option-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
    `;

    const optionList = deeplaneView.querySelector('.deeplane-option-list');

    // Add standard options
    qData.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'popup-option-item';
      btn.innerHTML = `
        <span class="option-index">${idx + 1}</span>
        <span class="option-text">${opt}</span>
        <svg class="option-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      `;

      btn.addEventListener('click', () => {
        answers[index] = opt;
        advanceDeepLane(strategyCard, index, answers, questionsList);
      });
      optionList.appendChild(btn);
    });

    // Custom Option + Skip Row
    const customRow = document.createElement('div');
    customRow.className = 'popup-option-item';
    customRow.style.borderTop = '1px dashed rgba(255,255,255,0.06)';
    customRow.style.marginTop = '4px';
    customRow.style.borderRadius = '0';
    customRow.style.background = 'transparent';
    customRow.style.cursor = 'default';

    // Edit Icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'option-index';
    iconSpan.style.background = 'transparent';
    iconSpan.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    `;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'option-text';
    labelSpan.style.color = 'var(--text-secondary)';
    labelSpan.style.cursor = 'pointer';
    labelSpan.textContent = 'Something else';
    labelSpan.addEventListener('click', () => {
      answers[index] = 'Custom input';
      advanceDeepLane(strategyCard, index, answers, questionsList);
    });

    const skipBtn = document.createElement('button');
    skipBtn.className = 'popup-skip-btn';
    skipBtn.textContent = 'Skip';
    skipBtn.addEventListener('click', () => {
      answers[index] = 'Skipped';
      advanceDeepLane(strategyCard, index, answers, questionsList);
    });

    customRow.appendChild(iconSpan);
    customRow.appendChild(labelSpan);
    customRow.appendChild(skipBtn);
    optionList.appendChild(customRow);

    // Back button handler (goes back to main selection view or previous step)
    deeplaneView.querySelector('.deeplane-back-btn').addEventListener('click', () => {
      if (index === 1) {
        deeplaneView.style.display = 'none';
        strategyCard.querySelector('.strategy-selection-view').style.display = 'block';
      } else {
        renderDeepLaneQuestion(strategyCard, index - 1, answers);
      }
      scrollToBottom();
    });
  }

  function advanceDeepLane(strategyCard, currentIndex, answers, questionsList) {
    if (currentIndex < questionsList.length) {
      renderDeepLaneQuestion(strategyCard, currentIndex + 1, answers);
      scrollToBottom();
    } else {
      // Hide strategy card and deeplane view
      const deeplaneView = strategyCard.querySelector('.strategy-deeplane-view');
      if (deeplaneView) deeplaneView.style.display = 'none';
      strategyCard.style.display = 'none';

      // Reset button border
      const messageContainer = strategyCard.closest('.claude-message');
      const checkThisBtn = messageContainer.querySelector('.check-this-btn');
      if (checkThisBtn) {
        checkThisBtn.style.color = '';
        checkThisBtn.style.borderColor = '';
      }

      // Check if all questions were skipped
      const allSkipped = questionsList.every((q, idx) => answers[idx + 1] === 'Skipped');

      if (!allSkipped) {
        // Complete Deep Lane Questions!
        const dynamicAnswersStr = questionsList.map((q, idx) => `(${q.title}: ${answers[idx + 1] || 'Skipped'})`).join(', ');
        const selectionSummary = `Regenerate strategy clarifying assumptions: ${dynamicAnswersStr}`;

        // Send message programmatically
        chatTextArea.value = selectionSummary;
        handleSendMessage();
      }
    }
  }

  function triggerBottomDeepLanePopup(strategyCard, questionsList, index = 1, answers = {}) {
    const qData = questionsList[index - 1];
    if (!qData) return;

    // Show popup
    mainWorkspace.classList.add('case-session');
    mainWorkspace.classList.add('case-wizard-active');
    chatTextArea.placeholder = 'Or reply directly...';

    // Populate header
    popupTitle.textContent = qData.title;
    popupProgress.textContent = `< ${index} of ${questionsList.length} >`;
    popupOptionList.innerHTML = '';

    // Standard Options
    qData.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'popup-option-item';
      btn.innerHTML = `
        <span class="option-index">${idx + 1}</span>
        <span class="option-text">${opt}</span>
        <svg class="option-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      `;

      btn.addEventListener('click', () => {
        answers[index] = opt;
        if (index < questionsList.length) {
          triggerBottomDeepLanePopup(strategyCard, questionsList, index + 1, answers);
        } else {
          // Complete Deep Lane Questions!
          mainWorkspace.classList.remove('case-wizard-active');
          chatTextArea.placeholder = 'Write a message...';

          const dynamicAnswersStr = questionsList.map((q, idx) => `(${q.title}: ${answers[idx + 1] || 'Skipped'})`).join(', ');
          const selectionSummary = `Regenerate strategy clarifying assumptions: ${dynamicAnswersStr}`;

          // Hide strategy card
          strategyCard.style.display = 'none';

          const messageContainer = strategyCard.closest('.claude-message');
          const checkThisBtn = messageContainer.querySelector('.check-this-btn');
          if (checkThisBtn) {
            checkThisBtn.style.color = '';
            checkThisBtn.style.borderColor = '';
          }

          // Programmatically submit the answers!
          chatTextArea.value = selectionSummary;
          handleSendMessage();
        }
      });
      popupOptionList.appendChild(btn);
    });

    // Custom Option + Skip Row
    const customRow = document.createElement('div');
    customRow.className = 'popup-option-item';
    customRow.style.borderTop = '1px dashed rgba(255,255,255,0.06)';
    customRow.style.marginTop = '4px';
    customRow.style.borderRadius = '0';
    customRow.style.background = 'transparent';
    customRow.style.cursor = 'default';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'option-index';
    iconSpan.style.background = 'transparent';
    iconSpan.innerHTML = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
    </svg>
  `;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'option-text';
    labelSpan.style.color = 'var(--text-secondary)';
    labelSpan.style.cursor = 'pointer';
    labelSpan.textContent = 'Something else';
    labelSpan.addEventListener('click', () => {
      answers[index] = 'Custom input';
      if (index < questionsList.length) {
        triggerBottomDeepLanePopup(strategyCard, questionsList, index + 1, answers);
      } else {
        mainWorkspace.classList.remove('case-wizard-active');
        chatTextArea.placeholder = 'Write a message...';
        const dynamicAnswersStr = questionsList.map((q, idx) => `(${q.title}: ${answers[idx + 1] || 'Skipped'})`).join(', ');
        const selectionSummary = `Regenerate strategy clarifying assumptions: ${dynamicAnswersStr}`;
        strategyCard.style.display = 'none';

        const messageContainer = strategyCard.closest('.claude-message');
        const checkThisBtn = messageContainer.querySelector('.check-this-btn');
        if (checkThisBtn) {
          checkThisBtn.style.color = '';
          checkThisBtn.style.borderColor = '';
        }

        chatTextArea.value = selectionSummary;
        handleSendMessage();
      }
    });

    const skipBtn = document.createElement('button');
    skipBtn.className = 'popup-skip-btn';
    skipBtn.textContent = 'Skip';
    skipBtn.addEventListener('click', () => {
      answers[index] = 'Skipped';
      if (index < questionsList.length) {
        triggerBottomDeepLanePopup(strategyCard, questionsList, index + 1, answers);
      } else {
        mainWorkspace.classList.remove('case-wizard-active');
        chatTextArea.placeholder = 'Write a message...';
        const dynamicAnswersStr = questionsList.map((q, idx) => `(${q.title}: ${answers[idx + 1] || 'Skipped'})`).join(', ');
        const selectionSummary = `Regenerate strategy clarifying assumptions: ${dynamicAnswersStr}`;
        strategyCard.style.display = 'none';

        const messageContainer = strategyCard.closest('.claude-message');
        const checkThisBtn = messageContainer.querySelector('.check-this-btn');
        if (checkThisBtn) {
          checkThisBtn.style.color = '';
          checkThisBtn.style.borderColor = '';
        }

        chatTextArea.value = selectionSummary;
        handleSendMessage();
      }
    });

    customRow.appendChild(iconSpan);
    customRow.appendChild(labelSpan);
    customRow.appendChild(skipBtn);
    popupOptionList.appendChild(customRow);
  }

  const popupQuestions = {
    1: {
      title: 'What type of case do you want to work through?',
      progress: '< 1 of 2 >',
      options: [
        { label: 'Product design ("design/improve X")', value: 'Product Design' },
        { label: 'Metrics/analytical ("diagnose this drop")', value: 'Metrics/Analytical' },
        { label: 'Strategy ("should they enter market Y")', value: 'Strategy' },
        { label: 'Estimation ("how many X per year")', value: 'Estimation' }
      ],
      customOption: 'Something else'
    },
    2: {
      title: 'What sector or company archetype do you want to target?',
      progress: '< 2 of 2 >',
      options: [
        { label: 'Consumer Tech (e.g., Airbnb, Uber, TikTok)', value: 'Consumer Tech' },
        { label: 'B2B / SaaS (e.g., Stripe, Salesforce, Slack)', value: 'B2B SaaS' },
        { label: 'AI / DevTools (e.g., OpenAI, GitHub, Vercel)', value: 'AI DevTools' },
        { label: 'Platform / Hardware (e.g., Google Cloud, Tesla, Apple)', value: 'Platform/Hardware' }
      ],
      customOption: 'Specific company...'
    }
  };

  // Render question card
  function renderPopupQuestion(index) {
    currentPopupIndex = index;
    const qData = popupQuestions[index];
    if (!qData) return;

    popupTitle.textContent = qData.title;
    popupProgress.textContent = qData.progress;
    popupOptionList.innerHTML = '';

    // Standard Options
    qData.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'popup-option-item';
      btn.innerHTML = `
        <span class="option-index">${idx + 1}</span>
        <span class="option-text">${opt.label}</span>
        <svg class="option-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      `;

      btn.addEventListener('click', () => {
        handleOptionSelection(opt.value);
      });
      popupOptionList.appendChild(btn);
    });

    // Custom Option + Skip Row
    const customRow = document.createElement('div');
    customRow.className = 'popup-option-item';
    customRow.style.borderTop = '1px dashed rgba(255,255,255,0.06)';
    customRow.style.marginTop = '4px';
    customRow.style.borderRadius = '0';
    customRow.style.background = 'transparent';
    customRow.style.cursor = 'default';

    // Edit Icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'option-index';
    iconSpan.style.background = 'transparent';
    iconSpan.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    `;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'option-text';
    labelSpan.style.color = 'var(--text-secondary)';
    labelSpan.style.cursor = 'pointer';
    labelSpan.textContent = qData.customOption;
    labelSpan.addEventListener('click', () => {
      handleOptionSelection(qData.customOption);
    });

    const skipBtn = document.createElement('button');
    skipBtn.className = 'popup-skip-btn';
    skipBtn.textContent = 'Skip';
    skipBtn.addEventListener('click', () => {
      handleOptionSelection('Skipped');
    });

    customRow.appendChild(iconSpan);
    customRow.appendChild(labelSpan);
    customRow.appendChild(skipBtn);
    popupOptionList.appendChild(customRow);
  }

  function handleOptionSelection(value) {
    if (currentPopupIndex === 1) {
      selectedCaseType = value;
      // Auto advance to second question
      renderPopupQuestion(2);
    } else if (currentPopupIndex === 2) {
      selectedSector = value;
      completePopupWizard();
    }
  }

  function completePopupWizard() {
    // Hide popup wizard elements
    mainWorkspace.classList.remove('case-wizard-active');
    chatTextArea.placeholder = 'Write a message...';

    // Post selection message into chat as user message
    let selectionSummary = '';
    if (selectedCaseType === 'Skipped' && selectedSector === 'Skipped') {
      selectionSummary = 'Let\'s ideate a general case study.';
    } else {
      const typeStr = selectedCaseType === 'Skipped' ? 'General' : selectedCaseType;
      const sectorStr = selectedSector === 'Skipped' ? 'General Sector' : selectedSector;
      selectionSummary = `${typeStr} case study targeting ${sectorStr}`;
    }

    // Programmatically send the message
    chatTextArea.value = selectionSummary;
    handleSendMessage();
  }

  popupCloseBtn.addEventListener('click', () => {
    mainWorkspace.classList.remove('case-wizard-active');
    chatTextArea.placeholder = mainWorkspace.classList.contains('chat-active') ? 'Write a message...' : 'How can I help you today?';
  });


  // --- 1. Sidebar Toggling ---
  function toggleSidebar() {
    sidebar.classList.toggle('expanded');
    const isExpanded = sidebar.classList.contains('expanded');
    sidebarToggle.setAttribute('data-tooltip', isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar');
  }

  sidebarToggle.addEventListener('click', toggleSidebar);

  mobileMenuTrigger.addEventListener('click', () => {
    sidebar.classList.add('mobile-open');
    sidebarOverlay.classList.add('show');
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('show');
  });

  // --- 2. Textarea Auto-expand & Send Button State ---
  function adjustTextAreaHeight() {
    chatTextArea.style.height = 'auto';
    chatTextArea.style.height = `${chatTextArea.scrollHeight}px`;

    // Show/hide send button based on text length or active response generation
    if (chatTextArea.value.trim().length > 0 || attachments.length > 0 || isGeneratingResponse) {
      sendMessageBtn.style.display = 'flex';
    } else {
      sendMessageBtn.style.display = 'none';
    }
  }

  chatTextArea.addEventListener('input', adjustTextAreaHeight);

  // Prevent default Enter newline and trigger send instead
  chatTextArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // --- 3. Profile settings Dropdown ---
  profileToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('show');
    modelDropdown.classList.remove('show');
  });

  // Settings Button - Custom name trigger
  const profileSettingsBtn = document.getElementById('profileSettingsBtn');
  if (profileSettingsBtn) {
    profileSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.remove('show');

      // Prompt user to enter a new name
      const newName = prompt("Change your display name:", userName);
      if (newName !== null) {
        const trimmed = newName.trim();
        if (trimmed) {
          localStorage.setItem('userName', trimmed);
          applyUserName(trimmed);
        } else {
          alert("Name cannot be empty!");
        }
      }
    });
  }

  // Close dropdowns on outside click
  window.addEventListener('click', () => {
    profileMenu.classList.remove('show');
    modelDropdown.classList.remove('show');
  });

  // --- 4. Model Selection Dropdown ---
  modelSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modelDropdown.classList.toggle('show');
    profileMenu.classList.remove('show');
  });

  modelOptions.forEach(option => {
    option.addEventListener('click', () => {
      modelOptions.forEach(opt => {
        opt.classList.remove('active');
        opt.querySelector('.check').style.display = 'none';
      });

      option.classList.add('active');
      option.querySelector('.check').style.display = 'block';

      activeModel = option.getAttribute('data-model');
      activeModelLabel.textContent = activeModel;
      modelDropdown.classList.remove('show');

      // Update sidebar indicator text
      document.querySelector('.sidebar-toggle-container span').textContent = activeModel.split(' ')[0] + ' ' + activeModel.split(' ')[1];
    });
  });

  // --- 5. Suggestions & Recent Chats Pills ---
  function loadPresetPrompt(promptText) {
    chatTextArea.value = promptText;
    chatTextArea.focus();
    adjustTextAreaHeight();

    // Smooth scroll down using active target
    scrollToBottom();
  }

  suggestionPills.forEach(pill => {
    if (pill.id !== 'drivePill') {
      pill.addEventListener('click', () => {
        loadPresetPrompt(pill.getAttribute('data-prompt'));
      });
    }
  });

  historyLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      loadPresetPrompt(link.getAttribute('data-prompt'));

      // On mobile, close sidebar after clicking history link
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('show');
    });
  });

  // --- 6. File Upload Attachment Simulation ---
  attachBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(file => {
      addAttachment(file.name, `${(file.size / 1024 / 1024).toFixed(1)} MB`);
    });
    // Reset file input value so same file can be uploaded again
    fileInput.value = '';
  });

  function addAttachment(name, size) {
    if (attachments.some(att => att.name === name)) return;

    const attachmentId = Date.now() + Math.random().toString(36).substr(2, 5);
    attachments.push({ id: attachmentId, name, size });

    const pill = document.createElement('div');
    pill.className = 'file-pill';
    pill.id = `pill-${attachmentId}`;
    pill.innerHTML = `
      <svg class="file-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span class="file-pill-name" title="${name}">${name}</span>
      <button class="file-pill-remove" data-id="${attachmentId}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    attachmentContainer.appendChild(pill);

    // Add remove handler
    pill.querySelector('.file-pill-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeAttachment(attachmentId);
    });

    adjustTextAreaHeight();
  }

  function removeAttachment(id) {
    attachments = attachments.filter(att => att.id !== id);
    const pill = document.getElementById(`pill-${id}`);
    if (pill) pill.remove();
    adjustTextAreaHeight();
  }

  // Google Drive Modal Trigger
  drivePill.addEventListener('click', () => {
    driveModal.classList.add('show');
  });

  driveCloseBtn.addEventListener('click', () => {
    driveModal.classList.remove('show');
  });

  // Click outside drive modal to close
  driveModal.addEventListener('click', (e) => {
    if (e.target === driveModal) {
      driveModal.classList.remove('show');
    }
  });

  driveFileItems.forEach(item => {
    item.addEventListener('click', () => {
      const fileName = item.getAttribute('data-name');
      const fileSize = item.getAttribute('data-size');
      addAttachment(fileName, fileSize);
      driveModal.classList.remove('show');
    });
  });

  // --- 7. Voice Dictation (Microphone) Simulation ---
  let isRecording = false;

  voiceDictationBtn.addEventListener('click', () => {
    if (isRecording) {
      cancelDictation();
    } else {
      startDictation();
    }
  });

  recordingCancelBtn.addEventListener('click', cancelDictation);

  function startDictation() {
    isRecording = true;
    voiceDictationBtn.classList.add('active');
    voiceDictationBtn.style.color = '#ef4444';
    recordingBar.classList.add('show');
    chatTextArea.placeholder = 'Speak now, listening...';
    chatTextArea.disabled = true;

    // Simulate typing transcription after 3.5 seconds
    dictationInterval = setTimeout(() => {
      chatTextArea.disabled = false;
      chatTextArea.placeholder = 'How can I help you today?';
      chatTextArea.value = 'Explain how artificial neural networks work in a single short paragraph.';
      cancelDictation();
      adjustTextAreaHeight();

      // Auto submit voice prompt
      setTimeout(handleSendMessage, 600);
    }, 3800);
  }

  function cancelDictation() {
    isRecording = false;
    voiceDictationBtn.classList.remove('active');
    voiceDictationBtn.style.color = '';
    recordingBar.classList.remove('show');
    chatTextArea.disabled = false;
    chatTextArea.placeholder = mainWorkspace.classList.contains('chat-active') ? 'Write a message...' : 'How can I help you today?';
    clearTimeout(dictationInterval);
  }

  // --- 8. Speaker Audio Player Simulation ---
  // Create beautiful sound wave bars
  function initVoiceWaveform() {
    voiceWaveform.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const barHeight = Math.floor(Math.random() * 16) + 4;
      const bar = document.createElement('span');
      bar.className = 'voice-bar';
      bar.style.height = `${barHeight}px`;
      voiceWaveform.appendChild(bar);
    }
  }

  initVoiceWaveform();

  voiceReadoutBtn.addEventListener('click', () => {
    voicePlayer.classList.toggle('show');
    if (voicePlayer.classList.contains('show')) {
      resetVoicePlayer();
    } else {
      pauseVoice();
    }
  });

  voicePlayBtn.addEventListener('click', () => {
    if (isVoicePlaying) {
      pauseVoice();
    } else {
      playVoice();
    }
  });

  function playVoice() {
    isVoicePlaying = true;
    voicePlayer.classList.add('playing');
    playSvg.style.display = 'none';
    pauseSvg.style.display = 'block';

    const bars = voiceWaveform.querySelectorAll('.voice-bar');

    // Animate waveform
    bars.forEach((bar, idx) => {
      bar.classList.add('active');
      bar.style.animationDelay = `${idx * 0.03}s`;
    });

    voiceTimerInterval = setInterval(() => {
      voiceCurrentSeconds--;
      if (voiceCurrentSeconds < 0) {
        resetVoicePlayer();
      } else {
        const secs = voiceCurrentSeconds % 60;
        voiceTime.textContent = `0:${secs < 10 ? '0' : ''}${secs}`;
      }
    }, 1000);
  }

  function pauseVoice() {
    isVoicePlaying = false;
    voicePlayer.classList.remove('playing');
    playSvg.style.display = 'block';
    pauseSvg.style.display = 'none';

    const bars = voiceWaveform.querySelectorAll('.voice-bar');
    bars.forEach(bar => {
      bar.classList.remove('active');
    });

    clearInterval(voiceTimerInterval);
  }

  // --- 9. Sending Messages & Chat Simulator ---
  sendMessageBtn.addEventListener('click', () => {
    if (isGeneratingResponse) {
      if (activeChatAbortController) {
        activeChatAbortController.abort();
      }
    } else {
      handleSendMessage();
    }
  });

  function handleSendMessage() {
    if (isGeneratingResponse) return;
    const text = chatTextArea.value.trim();
    if (text.length === 0 && attachments.length === 0) return;

    // Transition main layout into chat active state
    if (!mainWorkspace.classList.contains('chat-active')) {
      mainWorkspace.classList.add('chat-active');
      // On mobile, ensure sidebar closes when sending a message
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('show');
    }

    // Append User Message to Thread
    appendUserMessage(text, attachments);

    // Save to conversation history
    conversationHistory.push({ role: 'user', content: text });

    // Copy attachments state and reset
    const submittedAttachments = [...attachments];
    attachments = [];
    attachmentContainer.innerHTML = '';
    chatTextArea.value = '';
    chatTextArea.placeholder = 'Write a message...';
    adjustTextAreaHeight();

    // Scroll to bottom of chat
    scrollToBottom();

    // Trigger Claude Reply with slight typing latency
    simulateClaudeResponse(text, submittedAttachments);
  }

  function appendUserMessage(text, files) {
    const msgElement = document.createElement('div');
    msgElement.className = 'chat-message user-message';

    let filesHtml = '';
    if (files && files.length > 0) {
      filesHtml = `<div class="attachment-container" style="margin-top: 10px; pointer-events: none;">`;
      files.forEach(file => {
        filesHtml += `
          <div class="file-pill">
            <svg class="file-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="file-pill-name">${file.name}</span>
          </div>
        `;
      });
      filesHtml += `</div>`;
    }

    // Render paragraphs properly
    const textHtml = text.split('\n').map(para => `<p>${escapeHtml(para)}</p>`).join('');

    msgElement.innerHTML = `
      <div class="message-avatar">${escapeHtml(userInitials || 'IG')}</div>
      <div class="message-bubble">
        ${textHtml}
        ${filesHtml}
      </div>
    `;

    chatThreadContainer.appendChild(msgElement);
  }

  function appendTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'chat-message claude-message';
    indicator.id = 'claudeTypingIndicator';
    indicator.innerHTML = `
      <div class="message-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <div class="message-bubble">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    chatThreadContainer.appendChild(indicator);
    scrollToBottom();
  }

  // Helper function to safely escape html characters
  function escapeHtml(string) {
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('claudeTypingIndicator');
    if (indicator) indicator.remove();
  }

  // API key is securely managed on the backend server to prevent client-side exposure

  function convertMarkdownToHtml(markdown) {
    let escaped = escapeHtml(markdown);

    // Parse code blocks
    escaped = escaped.replace(/```(?:(\w+)\n)?([\s\S]+?)```/g, (match, lang, code) => {
      const language = lang || 'javascript';
      return `
        <div class="code-block-container">
          <div class="code-header">
            <span>${language}</span>
            <button class="copy-code-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy code
            </button>
          </div>
          <pre class="code-body"><code>${code.trim()}</code></pre>
        </div>
      `;
    });

    // Parse inline code
    escaped = escaped.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Parse headers
    escaped = escaped.replace(/^###\s+(.+)$/gm, '<h3 style="margin-top: 16px; margin-bottom: 8px; font-size: 16px; font-weight: 600; color: var(--text-primary);">$1</h3>');
    escaped = escaped.replace(/^##\s+(.+)$/gm, '<h2 style="margin-top: 20px; margin-bottom: 10px; font-size: 18px; font-weight: 600; color: var(--text-primary);">$1</h2>');
    escaped = escaped.replace(/^#\s+(.+)$/gm, '<h1 style="margin-top: 24px; margin-bottom: 12px; font-size: 22px; font-weight: 700; color: var(--text-primary);">$1</h1>');

    // Parse bold & italics
    escaped = escaped.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/__([\s\S]+?)__/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/_([\s\S]+?)_/g, '<em>$1</em>');

    // Parse bullet & ordered lists
    const lines = escaped.split('\n');
    let inList = false;
    let inOrderedList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      const bulletMatch = line.match(/^[\-\*]\s+(.+)$/);
      const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);

      if (bulletMatch) {
        if (inOrderedList) {
          lines[i - 1] += '\n</ol>';
          inOrderedList = false;
        }
        const content = bulletMatch[1];
        if (!inList) {
          lines[i] = `<ul style="margin-left: 20px; margin-bottom: 12px; list-style-type: disc;">\n<li>${content}</li>`;
          inList = true;
        } else {
          lines[i] = `<li>${content}</li>`;
        }
      } else if (orderedMatch) {
        if (inList) {
          lines[i - 1] += '\n</ul>';
          inList = false;
        }
        const content = orderedMatch[2];
        if (!inOrderedList) {
          lines[i] = `<ol style="margin-left: 20px; margin-bottom: 12px; list-style-type: decimal;">\n<li>${content}</li>`;
          inOrderedList = true;
        } else {
          lines[i] = `<li>${content}</li>`;
        }
      } else {
        if (inList) {
          lines[i - 1] += '\n</ul>';
          inList = false;
        }
        if (inOrderedList) {
          lines[i - 1] += '\n</ol>';
          inOrderedList = false;
        }
      }
    }
    if (inList) lines[lines.length - 1] += '\n</ul>';
    if (inOrderedList) lines[lines.length - 1] += '\n</ol>';

    escaped = lines.join('\n');

    // Parse paragraphs
    const finalLines = escaped.split('\n');
    for (let i = 0; i < finalLines.length; i++) {
      const line = finalLines[i].trim();
      if (line.length > 0 && !line.startsWith('<') && !line.endsWith('>')) {
        finalLines[i] = `<p style="margin-bottom: 12px; line-height: 1.6;">${line}</p>`;
      }
    }
    escaped = finalLines.join('\n');

    return escaped;
  }

  function getFallbackSimulation(userPrompt, files) {
    const lowerPrompt = userPrompt.toLowerCase();
    let content = "";

    if (lowerPrompt.includes('help me ideate a case study')) {
      content = `
        <p>Happy to. The most useful way to do this is to actually run one together—I throw a prompt, you work through it, I push back and point out gaps. But case studies come in different flavors and they each need a different approach, so let me aim at the right one.</p>
      `;
    } else if (lowerPrompt.includes('deep lane')) {
      const journeyMatch = userPrompt.match(/Journey Stage:\s*([^,)]+)/i);
      const focusMatch = userPrompt.match(/Core Focus:\s*([^,)]+)/i);
      const journeyStage = journeyMatch ? journeyMatch[1].trim() : 'Skipped';
      const coreFocus = focusMatch ? focusMatch[1].trim() : 'Skipped';

      content = `
        <p>Excellent selections. Tailoring the case study to your precise parameters:</p>
        <ul style="margin-left: 20px; margin-bottom: 16px;">
          <li><strong>Journey Stage:</strong> <code>${escapeHtml(journeyStage)}</code></li>
          <li><strong>Core Focus:</strong> <code>${escapeHtml(coreFocus)}</code></li>
        </ul>
        <p>Here is your regenerated, laser-focused prompt:</p>
        <p><strong>"Design a product to help B2B SaaS support teams streamline ticket resolution, optimized specifically for the stage of ${escapeHtml(journeyStage.toLowerCase())} with a core focus on ${escapeHtml(coreFocus.toLowerCase())}."</strong></p>
        <p>Let's run through this optimized B2B rubric reflecting your context:</p>
        <ul>
          <li><strong>Clarify first:</strong> Since your stage is <em>${escapeHtml(journeyStage)}</em>, we must prioritize initial product-market fit metrics or low-latency developer support workflows.</li>
          <li><strong>User vs. Buyer:</strong> The buyers care deeply about <em>${escapeHtml(coreFocus)}</em> to protect margins, while the users need intuitive tools.</li>
          <li><strong>Proposed Solution:</strong> A lightweight, context-aware integration inside the SaaS workspace.</li>
        </ul>
        <p>Propose your outline based on this tailored B2B dynamic, and I will critique your solution phase by phase.</p>
        <div class="assumption-box" style="background-color: rgba(16, 185, 129, 0.06); border-color: rgba(16, 185, 129, 0.18); color: #a7eec6;">
          <svg class="assumption-warning-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span class="assumption-text">Deep Lane regeneration complete! The rubric has been automatically customized to focus on <strong>${escapeHtml(coreFocus)}</strong>.</span>
        </div>
      `;
    } else if (lowerPrompt.includes('product design case study targeting b2b saas') || (lowerPrompt.includes('product design') && lowerPrompt.includes('b2b saas') && lowerPrompt.includes('case study'))) {
      content = `
        <p>Good call—B2B changes the texture of the whole answer. Here's your prompt:</p>
        <p><strong>"Design a product to help customer support teams at mid-size SaaS companies handle their ticket volume better."</strong></p>
        <p>Same deal: work through it out loud, structured, narrating your reasoning. Hold nothing back, and I'll hold my critique until you've done a full pass.</p>
        <p>Here's the rubric I'll be grading against—note that a few of these are B2B-specific and trip people up:</p>
        <ul>
          <li><strong>Clarify first.</strong> 1–2 sharp scoping questions. For B2B, good ones probe the business context: what's "better"—faster resolution, lower cost, higher CSAT? Any sense of company size or team size?</li>
          <li><strong>User vs. buyer.</strong> This is the B2B trap. The <em>user</em> (support agent) and the <em>buyer</em> (support manager or VP) are different people with different pain points. Strong candidates name both and are explicit about who they're designing for and who they're selling to. Skipping this is the most common B2B miss.</li>
          <li><strong>Segment and pick.</strong> "Mid-size SaaS support teams" still has variety—high-volume low-complexity tickets vs. low-volume technical tickets, for instance. Pick a segment with a reason.</li>
          <li><strong>Problem before solution, and tie it to business value.</strong> In B2C you optimize for user delight; in B2B you also have to connect the pain to money—agent time, headcount cost, churn from bad support, SLA breaches. Prioritize pain points and show you understand what the buyer actually cares about.</li>
          <li><strong>Solution + tradeoff.</strong> A few options, justify the pick. Bonus if you think about how it fits into their <em>existing</em> stack (Zendesk, Salesforce, etc.)—B2B products rarely get to be standalone.</li>
          <li><strong>Success metric.</strong> Close with how you'd measure it—and ideally distinguish a user-level metric (agent efficiency) from a business-level one (cost per ticket, retention).</li>
        </ul>
        <p>The B2B-specific instinct I'm really looking for: do you naturally hold <em>two</em> audiences in your head—the person clicking the buttons and the person signing the check?</p>
        <p>Go. Take your time, and finish your full pass before I weigh in.</p>
      `;
    } else if (files && files.length > 0) {
      content = `
        <p>I have successfully received and analyzed the attached file: <strong>${escapeHtml(files[0].name)}</strong>.</p>
        <p>This document aligns perfectly with your active workspace targets. Here is a brief summary of how we can utilize this data within <strong>${activeModel}</strong>:</p>
        <ul>
          <li><strong>Data Integrity:</strong> File structures look valid with complete schemas.</li>
          <li><strong>Optimizations:</strong> We can parse this into your custom Javascript utilities for rapid computation.</li>
          <li><strong>Next Steps:</strong> Let me know if you would like me to build a dynamic visualization script or integrate this content directly into your codebase.</li>
        </ul>
      `;
    } else if (lowerPrompt.includes('debounce') || lowerPrompt.includes('code')) {
      content = `
        <p>Here is a premium, high-performance **JavaScript Debounce function** featuring support for immediate execution, clean cancellation triggers, and visually smooth event integration.</p>
        <div class="code-block-container">
          <div class="code-header">
            <span>javascript</span>
            <button class="copy-code-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy code
            </button>
          </div>
          <pre class="code-body"><code>function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}</code></pre>
        </div>
      `;
    } else if (lowerPrompt.includes('workout') || lowerPrompt.includes('life stuff') || lowerPrompt.includes('workout plan')) {
      content = `
        <p>As a PM, efficiency is key. Here is a <strong>Weekly PM Workout Plan</strong> requiring zero equipment:</p>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr><th>Day</th><th>Workout Type</th><th>Duration</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Monday</strong></td><td>HIIT Sprints</td><td>15 Minutes</td></tr>
              <tr><td><strong>Tuesday</strong></td><td>Bodyweight Circuit</td><td>20 Minutes</td></tr>
              <tr><td><strong>Wednesday</strong></td><td>Active Recovery</td><td>10 Minutes</td></tr>
              <tr><td><strong>Thursday</strong></td><td>Lower Body Focus</td><td>20 Minutes</td></tr>
              <tr><td><strong>Friday</strong></td><td>Full Body HIIT</td><td>15 Minutes</td></tr>
            </tbody>
          </table>
        </div>
      `;
    } else {
      content = `
        <p>I am here to assist you with the power of <strong>${activeModel}</strong>. That is an excellent question.</p>
        <p>As we pair-program in your active workspace, I can help you design databases, debug complex codebases, format elegant markdown reports, or plan your product launches.</p>
        <p>How would you like to build on this? Let me know, and we can write some clean code blocks or map out custom architectures!</p>
      `;
    }

    return content;
  }

  function setSendButtonState(state) {
    if (state === 'stop') {
      sendMessageBtn.classList.add('generating');
      sendMessageBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" style="width: 12px; height: 12px;">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      `;
      sendMessageBtn.setAttribute('data-tooltip', 'Stop response generation');
    } else {
      sendMessageBtn.classList.remove('generating');
      sendMessageBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      `;
      sendMessageBtn.setAttribute('data-tooltip', 'Send message');
    }
  }

  function cleanupGenerationState() {
    isGeneratingResponse = false;
    activeChatAbortController = null;
    setSendButtonState('send');
    adjustTextAreaHeight();
  }

  async function simulateClaudeResponse(userPrompt, files) {
    appendTypingIndicator();

    isGeneratingResponse = true;
    setSendButtonState('stop');
    adjustTextAreaHeight();

    activeChatAbortController = new AbortController();
    const { signal } = activeChatAbortController;

    let responseContent = "";
    let isCaseStudyRequest = false;
    let warningText = "";
    let assumptionsList = [];
    let questionsList = [];

    const lowerPrompt = userPrompt.toLowerCase();
    const isGratitudePrompt = lowerPrompt.includes("thank") ||
      lowerPrompt.includes("thanks") ||
      lowerPrompt.includes("okay") ||
      lowerPrompt.includes("ok") ||
      lowerPrompt.includes("bye") ||
      lowerPrompt.includes("got the answer") ||
      lowerPrompt.includes("perfect");

    if (!isGratitudePrompt && (
      lowerPrompt.includes("case study") ||
      lowerPrompt.includes("fast lane") ||
      lowerPrompt.includes("deep lane") ||
      lowerPrompt.includes("strategy") ||
      lowerPrompt.includes("assumption") ||
      lowerPrompt.includes("startup")
    )) {
      isCaseStudyRequest = true;
    }

    try {
      const backendUrl = window.location.port === '3001' ? '/api/chat' : 'http://localhost:3001/api/chat';
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: userPrompt,
          messages: conversationHistory,
          attachments: files ? files.map(file => ({ name: file.name, size: file.size })) : [],
          model: activeModel
        }),
        signal
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Server returned unsuccessful response.');
      }

      const rawMarkdown = data.response;

      // Save assistant response to conversation history (including raw strategic block tags)
      conversationHistory.push({ role: 'assistant', content: rawMarkdown });

      responseContent = convertMarkdownToHtml(rawMarkdown);

      isCaseStudyRequest = !!data.isStrategyRequest;
      warningText = data.warning || "";
      assumptionsList = data.assumptions || [];
      questionsList = data.questions || [];

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("Chat request generation aborted by the user.");
        removeTypingIndicator();
        return;
      }

      console.error("Backend connection error, using simulation fallback:", error);
      responseContent = getFallbackSimulation(userPrompt, files);

      if (isCaseStudyRequest) {
        warningText = "This whole plan assumes you're selling to individual consumers (B2C). If you sell to companies, almost none of it holds.";
        assumptionsList = ["selling to consumers (B2C)", "subscription model", "US / Western market"];
        questionsList = [
          {
            title: "Where are you in the journey right now?",
            options: ["Just an idea so far", "Building the MVP", "Launched, getting first users", "Have users, want to grow"]
          },
          {
            title: "What is your primary focus for optimizing this strategy?",
            options: ["Reducing initial customer acquisition cost", "Improving retention and engagement", "Expanding to B2B segments", "Maximizing monetization and pricing loops"]
          }
        ];
      }
    } finally {
      if (signal.aborted) {
        cleanupGenerationState();
        return;
      }
    }

    if (isCaseStudyRequest) {
      const warning = escapeHtml(warningText || "This whole plan assumes you're selling to individual consumers (B2C). If you sell to companies, almost none of it holds.");
      const list = assumptionsList && assumptionsList.length === 3 ? assumptionsList : ["selling to consumers (B2C)", "subscription model", "US / Western market"];
      const qList = questionsList && questionsList.length === 2 ? questionsList : [
        {
          title: "Where are you in the journey right now?",
          options: ["Just an idea so far", "Building the MVP", "Launched, getting first users", "Have users, want to grow"]
        },
        {
          title: "What is your primary focus for optimizing this strategy?",
          options: ["Reducing initial customer acquisition cost", "Improving retention and engagement", "Expanding to B2B segments", "Maximizing monetization and pricing loops"]
        }
      ];

      const chip1 = escapeHtml(list[0]);
      const chip2 = escapeHtml(list[1]);
      const chip3 = escapeHtml(list[2]);
      const escapedQuestions = escapeHtml(JSON.stringify(qList));

      responseContent += `
        <div class="assumption-box">
          <svg class="assumption-warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span class="assumption-text">${warning}</span>
        </div>

        <div class="strategy-card" style="display: none;" data-questions="${escapedQuestions}">
          <!-- Selection View State -->
          <div class="strategy-selection-view">
            <div class="strategy-header">
              <svg class="strategy-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>Check this strategy</span>
            </div>
            <p class="strategy-subtitle">Here's what I assumed to build it. Tap anything that's off.</p>
            
            <div class="strategy-section">
              <span class="strategy-label">Assumptions I made</span>
              <div class="strategy-chips">
                <span class="strategy-tag" data-assumption="${chip1}">${chip1}</span>
                <span class="strategy-tag" data-assumption="${chip2}">${chip2}</span>
                <span class="strategy-tag" data-assumption="${chip3}">${chip3}</span>
              </div>
            </div>
            
            <div class="strategy-lanes">
              <div class="lane-panel" data-lane="fast">
                <div class="lane-header fast-lane-color">
                  <svg class="lane-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  <span>Fast lane</span>
                </div>
                <p class="lane-description">Tap the wrong chip, pick what's right, regenerate. No questions.</p>
              </div>
              
              <div class="lane-panel" data-lane="deep">
                <div class="lane-header deep-lane-color">
                  <svg class="lane-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Deep lane</span>
                </div>
                <p class="lane-description">Answer 2 quick questions, one at a time, then regenerate.</p>
              </div>
            </div>
          </div>

          <!-- Fast Lane Options View State -->
          <div class="strategy-fastlane-view" style="display: none; flex-direction: column;">
            <div class="lane-header fast-lane-color" style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <svg class="lane-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span style="font-size: 15px; font-weight: 600;">Fast lane</span>
              </div>
              <button class="fastlane-back-btn" style="background: none; border: none; color: var(--text-muted); font-size: 11.5px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 3px; padding: 2px;">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                <span>Back</span>
              </button>
            </div>
            <p class="strategy-subtitle">Pick which assumption is incorrect and then let claude rethink. No typing!</p>
            
            <div class="strategy-chips" style="margin-top: 14px; margin-bottom: 20px;">
              <button class="strategy-chip" data-assumption="${chip1}">${chip1}</button>
              <button class="strategy-chip" data-assumption="${chip2}">${chip2}</button>
              <button class="strategy-chip" data-assumption="${chip3}">${chip3}</button>
            </div>
            
            <div style="display: flex;">
              <button class="rethink-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rethink-icon">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>Rethink now</span>
                <span class="arrow-up-right">↗</span>
              </button>
            </div>
          </div>
        </div>

        <div class="assumption-actions">
          <button class="assumption-btn check-this-btn">
            <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Check this
          </button>
          <button class="assumption-btn looks-good-btn">Looks good</button>
        </div>
      `;
    }

    responseContent += `
      <div class="msg-feedback-bar">
        <button class="msg-feedback-btn" data-tooltip="Copy response">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="msg-feedback-btn" data-tooltip="Good response" data-coming-soon="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        </button>
        <button class="msg-feedback-btn" data-tooltip="Bad response" data-coming-soon="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm12-7h3a2 2 0 0 1 2 2v7a2 2 0 0 1 2 2h-3"/></svg>
        </button>
        <button class="msg-feedback-btn" data-tooltip="Retry" data-coming-soon="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        </button>
      </div>
      <div class="msg-asterisk-logo">
        <svg viewBox="0 0 24 24">
          <path d="M12,2 L14,9 L21,7 L16,12 L21,17 L14,15 L12,22 L10,15 L3,17 L8,12 L3,7 L10,9 Z" fill="currentColor"/>
        </svg>
      </div>
    `;

    removeTypingIndicator();

    const responseElement = document.createElement('div');
    responseElement.className = 'chat-message claude-message';
    responseElement.innerHTML = `
      <div class="message-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <div class="message-bubble">
        ${responseContent}
      </div>
    `;

    chatThreadContainer.appendChild(responseElement);

    // Wire up copy buttons inside the new message element
    responseElement.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const codeContainer = btn.closest('.code-block-container');
        const codeText = codeContainer.querySelector('code, div').textContent;
        navigator.clipboard.writeText(codeText).then(() => {
          const originalText = btn.innerHTML;
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Copied!
          `;
          btn.style.color = 'var(--accent-green)';
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.color = '';
          }, 2000);
        });
      });
    });

    scrollToBottom();
    cleanupGenerationState();
  }

  function scrollToBottom() {
    setTimeout(() => {
      const isChatActive = mainWorkspace.classList.contains('chat-active');
      const target = isChatActive ? chatThreadContainer : scrollContainer;
      target.scrollTo({
        top: target.scrollHeight,
        behavior: 'smooth'
      });
    }, 50);
  }

  // --- 10. Start New Chat Reset Button ---
  newChatNavBtn.addEventListener('click', () => {
    // Clear conversation
    chatThreadContainer.innerHTML = '';
    conversationHistory = [];

    // Switch UI states
    mainWorkspace.classList.remove('chat-active');
    mainWorkspace.classList.remove('case-active');
    casePopupCard.classList.remove('show');
    chatTextArea.placeholder = 'How can I help you today?';

    // Reset values
    chatTextArea.value = '';
    attachments = [];
    attachmentContainer.innerHTML = '';
    adjustTextAreaHeight();

    // Hide panels
    cancelDictation();
    resetVoicePlayer();
    voicePlayer.classList.remove('show');

    // On mobile, close sidebar
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('show');
  });

  // Click handler delegation for interactive assumption callout options
  chatThreadContainer.addEventListener('click', (e) => {
    const checkThisBtn = e.target.closest('.check-this-btn');
    const looksGoodBtn = e.target.closest('.looks-good-btn');
    const chipBtn = e.target.closest('.strategy-chip');
    const lanePanel = e.target.closest('.lane-panel');
    const rethinkBtn = e.target.closest('.rethink-btn');
    const fastlaneBackBtn = e.target.closest('.fastlane-back-btn');

    if (fastlaneBackBtn) {
      const messageContainer = fastlaneBackBtn.closest('.claude-message');
      const strategyCard = messageContainer.querySelector('.strategy-card');
      if (strategyCard) {
        strategyCard.querySelector('.strategy-fastlane-view').style.display = 'none';
        strategyCard.querySelector('.strategy-selection-view').style.display = 'block';
        scrollToBottom();
      }
    }

    if (checkThisBtn) {
      const messageContainer = checkThisBtn.closest('.claude-message');
      const strategyCard = messageContainer.querySelector('.strategy-card');
      if (strategyCard) {
        const isHidden = strategyCard.style.display === 'none' || !strategyCard.style.display;
        if (isHidden) {
          strategyCard.style.display = 'flex';
          checkThisBtn.style.color = 'var(--accent-coral)';
          checkThisBtn.style.borderColor = 'var(--accent-coral)';
          // Reset inner views to start from Selection state
          strategyCard.querySelector('.strategy-selection-view').style.display = 'block';
          strategyCard.querySelector('.strategy-fastlane-view').style.display = 'none';
          const deeplaneView = strategyCard.querySelector('.strategy-deeplane-view');
          if (deeplaneView) deeplaneView.style.display = 'none';
          scrollToBottom();
        } else {
          strategyCard.style.display = 'none';
          checkThisBtn.style.color = '';
          checkThisBtn.style.borderColor = '';
        }
      }
    }

    if (chipBtn) {
      const assumptionName = chipBtn.getAttribute('data-assumption');
      const messageContainer = chipBtn.closest('.claude-message');
      const siblingChips = messageContainer.querySelectorAll(`.strategy-chip[data-assumption="${assumptionName}"]`);

      chipBtn.classList.toggle('off');
      const isOff = chipBtn.classList.contains('off');

      siblingChips.forEach(chip => {
        if (isOff) {
          chip.classList.add('off');
          chip.style.textDecoration = 'line-through';
          chip.style.opacity = '0.5';
          chip.style.borderColor = 'var(--accent-coral)';
          chip.style.color = 'var(--accent-coral)';
          chip.style.backgroundColor = 'rgba(224, 92, 67, 0.05)';
        } else {
          chip.classList.remove('off');
          chip.style.textDecoration = 'none';
          chip.style.opacity = '1';
          chip.style.borderColor = '';
          chip.style.color = '';
          chip.style.backgroundColor = '';
        }
      });
    }

    if (lanePanel) {
      const laneType = lanePanel.getAttribute('data-lane');
      const messageContainer = lanePanel.closest('.claude-message');
      const strategyCard = messageContainer.querySelector('.strategy-card');

      if (laneType === 'fast') {
        // Swap selection view to fastlane details view
        strategyCard.querySelector('.strategy-selection-view').style.display = 'none';
        const fastLaneView = strategyCard.querySelector('.strategy-fastlane-view');
        fastLaneView.style.display = 'flex';
        scrollToBottom();
      } else if (laneType === 'deep') {
        const originalBg = lanePanel.style.backgroundColor;
        lanePanel.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
        lanePanel.style.borderColor = '#10b981';

        setTimeout(() => {
          lanePanel.style.backgroundColor = originalBg;
          lanePanel.style.borderColor = '';

          renderDeepLaneQuestion(strategyCard, 1);
          scrollToBottom();
        }, 400);
      }
    }

    if (rethinkBtn) {
      const messageContainer = rethinkBtn.closest('.claude-message');
      const offChips = Array.from(messageContainer.querySelectorAll('.strategy-fastlane-view .strategy-chip.off')).map(c => c.getAttribute('data-assumption'));

      rethinkBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--accent-green)" stroke-width="2.5" class="rethink-icon" style="animation: rotate 1s linear infinite; margin-right: 6px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        <span>Rethinking...</span>
      `;
      rethinkBtn.style.color = 'var(--accent-green)';
      rethinkBtn.style.borderColor = 'var(--accent-green)';

      setTimeout(() => {
        const offChipsStr = offChips.length > 0 ? ` (excluding incorrect assumption(s): ${offChips.join(', ')})` : '';
        chatTextArea.value = `Regenerate strategy${offChipsStr}.`;
        handleSendMessage();

        rethinkBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rethink-icon">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>Rethink now</span>
          <span class="arrow-up-right">↗</span>
        `;
        rethinkBtn.style.color = '';
        rethinkBtn.style.borderColor = '';
      }, 1000);
    }

    if (looksGoodBtn) {
      const originalText = looksGoodBtn.innerHTML;
      looksGoodBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--accent-green)" stroke-width="2.5" style="margin-right: 4px;"><polyline points="20 6 9 17 4 12"/></svg>
        Looks good!
      `;
      looksGoodBtn.style.color = 'var(--accent-green)';
      looksGoodBtn.style.borderColor = 'var(--accent-green)';

      setTimeout(() => {
        looksGoodBtn.innerHTML = originalText;
        looksGoodBtn.style.color = '';
        looksGoodBtn.style.borderColor = '';
      }, 2000);
    }
  });

  // Custom initialization tooltip alerts
  console.log("Claude UI Replica loaded perfectly with all interactive click handlers!");
});
