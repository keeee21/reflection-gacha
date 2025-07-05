document.addEventListener('DOMContentLoaded', () => {
  // --- DOM要素の取得 ---
  const situationSelect = document.getElementById('situation');
  const spinButton = document.getElementById('spin-button');
  const courseResultContainer = document.getElementById('course-result');
  const modal = document.getElementById('modal');
  const modalContent = modal.querySelector('.modal-content');
  const modalCloseButton = document.getElementById('modal-close-button');
  
  // タブ関連の要素を追加
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  let techniques = [];
  let courses = [];

  // --- データ読み込み ---
  async function loadData() {
		try {
				const [techniquesRes, coursesRes] = await Promise.all([
						fetch('./data/techniques.json'),
						fetch('./data/courses.json')
				]);
				techniques = await techniquesRes.json();
				courses = await coursesRes.json();
				spinButton.disabled = false;
				spinButton.textContent = "ガチャを回す";
				
				// 技法一覧を初期化
				initializeTechniquesTab();
		} catch (error) {
				console.error("データの読み込みに失敗しました:", error);
				courseResultContainer.innerHTML = `<p>エラー: データの読み込みに失敗しました。ページをリロードしてください。</p>`;
		}
  }

  // --- タブ切り替え機能 ---
  function switchTab(targetTab) {
		// 全てのタブボタンのactiveクラスを削除
		tabButtons.forEach(btn => btn.classList.remove('active'));
		
		// 全てのタブコンテンツを非表示
		tabContents.forEach(content => content.style.display = 'none');
		
		// 選択されたタブボタンにactiveクラスを追加
		document.querySelector(`[data-tab="${targetTab}"]`).classList.add('active');
		
		// 対応するタブコンテンツを表示
		document.getElementById(`${targetTab}-tab`).style.display = 'block';
  }

  // --- 技法一覧タブの初期化 ---
  function initializeTechniquesTab() {
		const phaseContainers = {
				'check-in': document.getElementById('checkin-techniques'),
				'gather-data': document.getElementById('gather-techniques'),
				'generate-insights': document.getElementById('insights-techniques'),
				'decide-what-to-do': document.getElementById('decide-techniques'),
				'check-out': document.getElementById('checkout-techniques')
		};

		// 各フェーズの技法を表示
		Object.keys(phaseContainers).forEach(phaseKey => {
				const container = phaseContainers[phaseKey];
				const phaseTechniques = techniques.filter(tech => tech.phases.includes(phaseKey));
				
				container.innerHTML = '';
				phaseTechniques.forEach(technique => {
						const techniqueCard = document.createElement('div');
						techniqueCard.className = 'technique-card';
						techniqueCard.style.cursor = 'pointer';
						techniqueCard.dataset.techId = technique.id;
						techniqueCard.innerHTML = `
								<h3>${technique.name}</h3>
								<p>${technique.description}</p>
								<div class="technique-meta">
										<span class="technique-time">⏱️ ${technique.estimatedTime[0]}〜${technique.estimatedTime[1]}分</span>
										<span class="technique-difficulty">${getDifficultyLabel(technique.difficulty)}</span>
								</div>
						`;
						container.appendChild(techniqueCard);
				});
		});
  }

  // --- フェーズに適した技法を選択 ---
  function selectTechniqueForPhase(phaseKey) {
		const availableTechniques = techniques.filter(tech => tech.phases.includes(phaseKey));
		if (availableTechniques.length === 0) {
				console.warn(`フェーズ ${phaseKey} に対応する技法が見つかりません`);
				return null;
		}
		return availableTechniques[Math.floor(Math.random() * availableTechniques.length)];
  }

  // --- コース構造を動的に生成 ---
  function generateCourseStructure() {
		const phaseOrder = ["check-in", "gather-data", "generate-insights", "decide-what-to-do", "check-out"];
		const selectedTechniques = {};
		
		phaseOrder.forEach(phaseKey => {
				const technique = selectTechniqueForPhase(phaseKey);
				if (technique) {
						selectedTechniques[phaseKey] = technique;
				}
		});
		
		return selectedTechniques;
  }

  // --- 合計時間を計算 ---
  function calculateTotalTime(selectedTechniques) {
		let minTime = 0;
		let maxTime = 0;
		
		Object.values(selectedTechniques).forEach(technique => {
				if (technique && technique.estimatedTime) {
						minTime += technique.estimatedTime[0];
						maxTime += technique.estimatedTime[1];
				}
		});
		
		return [minTime, maxTime];
  }

  // --- ガチャ実行 ---
  function spinGacha() {
		const selectedSituation = situationSelect.value;
		const filteredCourses = courses.filter(c => c.situationTags.includes(selectedSituation));

		if (filteredCourses.length === 0) {
				courseResultContainer.innerHTML = `<p>この状況に合うコースが見つかりませんでした。</p>`;
				return;
		}

		const randomCourse = filteredCourses[Math.floor(Math.random() * filteredCourses.length)];
		const selectedTechniques = generateCourseStructure();
		displayCourse(randomCourse, selectedTechniques);
  }

  // --- コース表示 ---
  function displayCourse(course, selectedTechniques) {
		courseResultContainer.innerHTML = ''; // 結果をクリア

		// 合計時間を計算
		const totalTime = calculateTotalTime(selectedTechniques);

		// コース全体のヘッダー情報を表示
		const courseHeader = document.createElement('div');
		courseHeader.className = 'course-header';
		courseHeader.innerHTML = `
				<h2>${course.name}</h2>
				<p>${course.description}</p>
				<p><strong>予想合計時間: ${totalTime[0]}〜${totalTime[1]}分</strong></p>
		`;
		courseResultContainer.appendChild(courseHeader);

		// 各フェーズのカードを表示
		const phaseOrder = ["check-in", "gather-data", "generate-insights", "decide-what-to-do", "check-out"];
		
		phaseOrder.forEach((phaseKey, index) => {
				const technique = selectedTechniques[phaseKey];
				const phaseInfo = course.phases[index];
				
				if (!technique || !phaseInfo) return;

				const card = document.createElement('div');
				card.className = 'phase-card';
				card.innerHTML = `
						<div class="phase-title">
								${phaseInfo.name}
								<span>${technique.estimatedTime[0]}〜${technique.estimatedTime[1]}分</span>
						</div>
						<div class="phase-purpose">
								<small>目的: ${phaseInfo.purpose}</small>
						</div>
						<h3 class="phase-technique-name">${technique.name}</h3>
						<p>${technique.description}</p>
						<div class="technique-difficulty">
								<small>難易度: ${getDifficultyLabel(technique.difficulty)}</small>
						</div>
						<button class="phase-details-button" data-tech-id="${technique.id}">詳細を見る</button>
				`;
				courseResultContainer.appendChild(card);
		});
  }

  // --- 難易度ラベル取得 ---
  function getDifficultyLabel(difficulty) {
		const difficultyLabels = {
				'easy': '🟢 かんたん',
				'medium': '🟡 ふつう',
				'hard': '🔴 むずかしい'
		};
		return difficultyLabels[difficulty] || '🟡 ふつう';
  }

  // --- 詳細モーダル表示 ---
  function showModal(technique) {
		modalContent.innerHTML = `
				<button id="modal-close-button" class="modal-close">&times;</button>
				<h2>${technique.name}</h2>
				<div class="technique-meta">
						<span class="technique-time">⏱️ ${technique.estimatedTime[0]}〜${technique.estimatedTime[1]}分</span>
						<span class="technique-difficulty">${getDifficultyLabel(technique.difficulty)}</span>
				</div>
				<p>${technique.description}</p>

				<h3>🛠️ やり方</h3>
				<ol>
						${technique.steps.map(step => `<li>${step}</li>`).join('')}
				</ol>

				${technique.facilitatorIntent ? `
				<h3>🎯 ファシリテーターの意図</h3>
				<p class="facilitator-intent">${technique.facilitatorIntent}</p>
				` : ''}

				${technique.facilitatorGoals ? `
				<h3>📋 達成すべき目標</h3>
				<ul class="facilitator-goals">
						${technique.facilitatorGoals.map(goal => `<li>${goal}</li>`).join('')}
				</ul>
				` : ''}

				${technique.facilitatorTips ? `
				<h3>💡 ファシリテーションのコツ</h3>
				<ul class="facilitator-tips">
						${technique.facilitatorTips.map(tip => `<li>${tip}</li>`).join('')}
				</ul>
				` : ''}

				<h3>💬 ファシリテーションの問いかけ例</h3>
				<ul>
						${technique.facilitatorQuestions.map(q => `<li>「${q}」</li>`).join('')}
				</ul>

				<h3>⚠️ 注意点</h3>
				<div class="caution">
						<ul>
								${technique.cautions.map(c => `<li>${c}</li>`).join('')}
						</ul>
				</div>
				
				<h3>🎨 テンプレートイメージ</h3>
				<div class="template-images">
						<div class="template-item">
								<h4>Miro</h4>
								<img src="${technique.templateImages.miro}" alt="Miro Template" class="template-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
								<p class="template-placeholder" style="display: none;">テンプレート画像を準備中...</p>
						</div>
						<div class="template-item">
								<h4>FigJam</h4>
								<img src="${technique.templateImages.figjam}" alt="FigJam Template" class="template-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
								<p class="template-placeholder" style="display: none;">テンプレート画像を準備中...</p>
						</div>
				</div>
		`;
		// モーダルの閉じるボタンに再度イベントリスナーを設定
		modalContent.querySelector('.modal-close').addEventListener('click', () => modal.style.display = 'none');
		modal.style.display = 'flex';
  }

  // --- イベントリスナー設定 ---
  spinButton.addEventListener('click', spinGacha);
  
  // タブ切り替えイベントリスナーを追加
  tabButtons.forEach(button => {
		button.addEventListener('click', (e) => {
				const targetTab = e.target.dataset.tab;
				switchTab(targetTab);
		});
  });
  
  courseResultContainer.addEventListener('click', e => {
		if (e.target.classList.contains('phase-details-button')) {
				const techId = e.target.dataset.techId;
				const technique = techniques.find(t => t.id === techId);
				if(technique) showModal(technique);
		}
  });
  
  // 技法一覧タブでのカードクリック
  document.getElementById('techniques-tab').addEventListener('click', e => {
		// カード全体がクリックされた場合
		if (e.target.classList.contains('technique-card') || e.target.closest('.technique-card')) {
				const card = e.target.classList.contains('technique-card') ? e.target : e.target.closest('.technique-card');
				const techId = card.dataset.techId;
				const technique = techniques.find(t => t.id === techId);
				if(technique) showModal(technique);
		}
  });

  modalCloseButton.addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', e => {
		if (e.target === modal) {
				modal.style.display = 'none';
		}
  });

  // --- 初期化 ---
  spinButton.disabled = true;
  spinButton.textContent = "データを読み込み中...";
  loadData();
});