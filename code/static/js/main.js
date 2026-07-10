document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");
    const selectedFilesContainer = document.getElementById("selected-files-container");
    const fileCountSpan = document.getElementById("file-count");
    const fileListDiv = document.getElementById("file-list");
    const samplesGrid = document.getElementById("samples-grid");
    const analyzeBtn = document.getElementById("analyze-btn");
    const clearBtn = document.getElementById("clear-btn");
    const loader = document.getElementById("analysis-loader");
    const loaderProgress = document.getElementById("loader-progress");
    const resultsSection = document.getElementById("results-section");
    const resultsGrid = document.getElementById("results-grid");
    
    // Modal Elements
    const modal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");
    const modalTitle = document.getElementById("modal-title");
    const modalMetricFire = document.getElementById("modal-metric-fire");
    const modalMetricHuman = document.getElementById("modal-metric-human");
    const modalMetricSmoke = document.getElementById("modal-metric-smoke");
    const modalPriorityBadge = document.getElementById("modal-priority-badge");
    const modalDispatchInstruction = document.getElementById("modal-dispatch-instruction");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const modalCloseBackdrop = document.getElementById("modal-close-backdrop");

    // State Variables
    let selectedUploadedFiles = [];
    let selectedSampleNames = new Set();
    let currentResults = [];

    // 1. Load Test Dataset Samples
    async function loadSamples() {
        try {
            const response = await fetch("/api/samples");
            const data = await response.json();
            
            if (data.samples && data.samples.length > 0) {
                samplesGrid.innerHTML = "";
                data.samples.forEach(sample => {
                    const card = document.createElement("div");
                    card.className = "sample-card";
                    card.dataset.name = sample;
                    
                    const img = document.createElement("img");
                    img.src = `/static/samples/${sample}`;
                    img.alt = sample;
                    img.loading = "lazy";
                    
                    const overlay = document.createElement("div");
                    overlay.className = "check-overlay";
                    overlay.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
                    
                    card.appendChild(img);
                    card.appendChild(overlay);
                    
                    card.addEventListener("click", () => toggleSampleSelection(sample, card));
                    samplesGrid.appendChild(card);
                });
            } else {
                samplesGrid.innerHTML = `<p class="section-desc">No test samples found in the static/samples folder.</p>`;
            }
        } catch (error) {
            console.error("Failed to load sample list:", error);
            samplesGrid.innerHTML = `<p class="section-desc">Error loading sample dataset.</p>`;
        }
    }

    function toggleSampleSelection(name, cardElement) {
        if (selectedSampleNames.has(name)) {
            selectedSampleNames.delete(name);
            cardElement.classList.remove("selected");
        } else {
            selectedSampleNames.add(name);
            cardElement.classList.add("selected");
        }
        updateUIState();
    }

    // 2. Drag & Drop Upload Handlers
    dropZone.addEventListener("click", () => fileInput.click());
    
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handleFilesSelected(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
        }
    });

    function handleFilesSelected(fileList) {
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            // Check if file is already added
            if (!selectedUploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
                selectedUploadedFiles.push(file);
            }
        }
        renderSelectedFileList();
        updateUIState();
    }

    function renderSelectedFileList() {
        if (selectedUploadedFiles.length > 0) {
            selectedFilesContainer.style.display = "block";
            fileCountSpan.textContent = selectedUploadedFiles.length;
            fileListDiv.innerHTML = "";
            
            selectedUploadedFiles.forEach((file, index) => {
                const item = document.createElement("div");
                item.className = "file-item";
                
                const name = document.createElement("span");
                name.className = "file-item-name";
                name.textContent = file.name;
                
                const removeBtn = document.createElement("button");
                removeBtn.className = "file-remove-btn";
                removeBtn.textContent = "Remove";
                removeBtn.addEventListener("click", () => {
                    selectedUploadedFiles.splice(index, 1);
                    renderSelectedFileList();
                    updateUIState();
                });
                
                item.appendChild(name);
                item.appendChild(removeBtn);
                fileListDiv.appendChild(item);
            });
        } else {
            selectedFilesContainer.style.display = "none";
        }
    }

    // 3. UI Helper States
    function updateUIState() {
        const totalSelected = selectedUploadedFiles.length + selectedSampleNames.size;
        analyzeBtn.disabled = totalSelected < 3;
        
        if (totalSelected >= 3) {
            analyzeBtn.querySelector("span").textContent = `Analyze & Rank ${totalSelected} Scenes`;
        } else {
            analyzeBtn.querySelector("span").textContent = "Analyze & Rank Scenes";
        }
    }

    function clearAll() {
        selectedUploadedFiles = [];
        selectedSampleNames.clear();
        fileInput.value = "";
        renderSelectedFileList();
        
        // Remove selection borders on sample cards
        document.querySelectorAll(".sample-card").forEach(card => {
            card.classList.remove("selected");
        });
        
        resultsSection.style.display = "none";
        resultsGrid.innerHTML = "";
        updateUIState();
    }

    clearBtn.addEventListener("click", clearAll);

    // 4. API Request Handler
    analyzeBtn.addEventListener("click", async () => {
        const totalSelected = selectedUploadedFiles.length + selectedSampleNames.size;
        if (totalSelected < 3) return;

        // Show Loader & Reset progress fill
        loader.style.display = "flex";
        loaderProgress.style.width = "0%";
        
        // Simulate progress bar increments
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.floor(Math.random() * 15) + 5;
                if (progress > 90) progress = 90;
                loaderProgress.style.width = `${progress}%`;
            }
        }, 300);

        try {
            const formData = new FormData();
            
            // Append uploaded files
            selectedUploadedFiles.forEach(file => {
                formData.append("images", file);
            });
            
            // Append selected sample filenames
            selectedSampleNames.forEach(sampleName => {
                formData.append("samples", sampleName);
            });

            const response = await fetch("/api/analyze", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            
            clearInterval(progressInterval);
            loaderProgress.style.width = "100%";
            
            setTimeout(() => {
                loader.style.display = "none";
                if (response.ok) {
                    renderResults(data.results);
                } else {
                    alert(data.error || "An error occurred during analysis.");
                }
            }, 500);

        } catch (error) {
            clearInterval(progressInterval);
            loader.style.display = "none";
            console.error("Inference analysis failed:", error);
            alert("Connection error: Failed to reach the backend triage server.");
        }
    });

    // 5. Render Ranked Results Cards
    function renderResults(results) {
        currentResults = results;
        resultsGrid.innerHTML = "";
        resultsSection.style.display = "block";
        
        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: "smooth" });

        results.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = `card glass-card incident-card p-${item.color_class}`;
            card.style.animationDelay = `${index * 150}ms`;

            // Card Header
            const cardHeader = document.createElement("div");
            cardHeader.className = "incident-rank-header";
            cardHeader.innerHTML = `
                <span class="rank-badge">Incident Rank #${index + 1}</span>
                <span class="badge ${getPriorityBadgeClass(item.color_class)}">${item.priority_badge}</span>
            `;

            // Image Container
            const imgWrapper = document.createElement("div");
            imgWrapper.className = "incident-image-wrapper";
            
            const img = document.createElement("img");
            img.src = item.annotated_url || "/static/samples/" + item.original_name;
            img.alt = item.original_name;
            
            const overlay = document.createElement("div");
            overlay.className = "view-overlay";
            overlay.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
            
            imgWrapper.appendChild(img);
            imgWrapper.appendChild(overlay);
            imgWrapper.addEventListener("click", () => openLightbox(item, index));

            // Content Meta Area
            const metaDiv = document.createElement("div");
            metaDiv.className = "incident-meta";
            
            const title = document.createElement("h4");
            title.className = "incident-title";
            title.textContent = item.original_name;
            
            const metrics = document.createElement("div");
            metrics.className = "detection-metrics";
            metrics.innerHTML = `
                <span class="metric-tag">🔥 ${item.counts.fire} Fire</span>
                <span class="metric-tag">👤 ${item.counts.human} Humans</span>
                <span class="metric-tag">💨 ${item.counts.smoke} Smoke</span>
            `;

            const dispatchBlock = document.createElement("div");
            dispatchBlock.className = "dispatch-instruction-block";
            dispatchBlock.textContent = item.dispatch_info;

            metaDiv.appendChild(title);
            metaDiv.appendChild(metrics);
            metaDiv.appendChild(dispatchBlock);

            card.appendChild(cardHeader);
            card.appendChild(imgWrapper);
            card.appendChild(metaDiv);
            
            resultsGrid.appendChild(card);
        });
    }

    function getPriorityBadgeClass(colorClass) {
        if (colorClass === "danger" || colorClass === "danger-single") return "badge-danger";
        if (colorClass === "warning" || colorClass === "warning-single") return "badge-warning";
        return "badge-success";
    }

    // 6. Lightbox modal popup handlers
    function openLightbox(item, index) {
        modalImage.src = item.annotated_url || "/static/samples/" + item.original_name;
        modalTitle.textContent = `Incident Triage Report - #${index + 1}: ${item.original_name}`;
        
        modalMetricFire.textContent = `🔥 ${item.counts.fire} Fire`;
        modalMetricHuman.textContent = `👤 ${item.counts.human} Humans`;
        modalMetricSmoke.textContent = `💨 ${item.counts.smoke} Smoke`;
        
        // Remove prior class names and add current
        modalPriorityBadge.className = `badge ${getPriorityBadgeClass(item.color_class)}`;
        modalPriorityBadge.textContent = item.priority_badge;
        
        modalDispatchInstruction.textContent = item.dispatch_info;
        
        // Render border/shadow colors in modal priority container
        const priorityContainer = document.getElementById("modal-priority-container");
        priorityContainer.style.borderLeftColor = getHexForColorClass(item.color_class);

        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Disable background scrolling
    }

    function getHexForColorClass(colorClass) {
        switch (colorClass) {
            case "danger": return "#ef4444";
            case "danger-single": return "#dc2626";
            case "warning": return "#f97316";
            case "warning-single": return "#ea580c";
            case "info": return "#eab308";
            case "success": return "#10b981";
            default: return "#6366f1";
        }
    }

    function closeLightbox() {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }

    modalCloseBtn.addEventListener("click", closeLightbox);
    modalCloseBackdrop.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeLightbox();
    });

    // Initialize Page
    loadSamples();
});
