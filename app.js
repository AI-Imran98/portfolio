/* ==========================================================================
   AI Integration Portfolio Custom Frontend Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Header Scroll Effect ---
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Mobile Navigation Toggle ---
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        const icon = mobileToggle.querySelector('i');
        if (navLinks.classList.contains('open')) {
            icon.className = 'fa-solid fa-xmark';
        } else {
            icon.className = 'fa-solid fa-bars';
        }
    });

    // --- Section Nav Tracking Active States ---
    const navItems = document.querySelectorAll('.nav-item:not(.btn-contact-nav)');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').includes(current)) {
                item.classList.add('active');
            }
        });
    });

    // Close mobile nav on item click
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('open');
            mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
        });
    });


    // ==========================================================================
    // Core Tabs Switcher System
    // ==========================================================================
    function setupTabs(navSelector, panelSelector, activeClass = 'active') {
        const tabs = document.querySelectorAll(navSelector);
        const panels = document.querySelectorAll(panelSelector);

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab') || tab.getAttribute('data-kit');
                
                tabs.forEach(t => t.classList.remove(activeClass));
                panels.forEach(p => p.classList.remove(activeClass));
                
                tab.classList.add(activeClass);
                const targetPanel = document.getElementById(target);
                if (targetPanel) {
                    targetPanel.classList.add(activeClass);
                }
            });
        });
    }

    setupTabs('.tab-btn', '.tab-panel');
    setupTabs('.kit-btn', '.kit-content');


    // ==========================================================================
    // Demo 1: RAG Document Chatbot Simulation
    // ==========================================================================
    const docButtons = document.querySelectorAll('.doc-btn');
    const customUploadArea = document.getElementById('custom-upload-area');
    const btnIngest = document.getElementById('btn-ingest-doc');
    const ragLogs = document.getElementById('rag-logs');
    const ragLogLines = document.getElementById('rag-log-lines');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const suggestedPrompts = document.getElementById('suggested-prompts');
    const fileInput = document.getElementById('file-input');

    let currentDocument = 'financial'; 
    let documentIngested = true; // Financials pre-loaded

    // Sample Document Responses Database
    const ragDatabase = {
        financial: {
            name: "Q1_Financials.pdf",
            prompts: ["What is our net revenue?", "What are the growth targets?", "What is our gross margin?"],
            queries: {
                "net revenue": "Our net revenue for Q1 2026 reached **$42.8 Million**, representing a stellar 18.4% year-over-year increase compared to Q1 2025.",
                "growth targets": "Our main Q2/Q3 growth targets involve scaling cloud subscriptions by **25%** and expanding strategic enterprise AI integrations across EU markets.",
                "gross margin": "The gross margin for Q1 2026 settled at **68.2%**, highly driven by decreased infrastructure overhead and model token optimizations."
            },
            fallback: "I can confirm that the financial PDF outlines operations, gross margins (68.2%), and total net revenue ($42.8M). Could you please rephrase or ask about specific revenue levels?",
            citation: "Q1_Financials.pdf | Page 4, Paragraph 2"
        },
        handbook: {
            name: "HR_Handbook.pdf",
            prompts: ["What is the holiday policy?", "What are our medical benefits?", "What is core work hours?"],
            queries: {
                "holiday policy": "Full-time employees receive **22 days of paid time off (PTO)** annually, in addition to 11 public holidays. PTO accrues monthly.",
                "medical benefits": "We offer comprehensive health coverage matching 90% of dental, optical, and general practitioners' costs from day one of employment.",
                "core work hours": "Our flexible operational window outlines core collaboration hours between **10:00 AM and 3:00 PM EST**, allowing you to balance work around your lifestyle."
            },
            fallback: "The HR Handbook PDF indexes vacation rules (22 days PTO), flexible working hours, and medical coverage. Ask me a specific question on those topics!",
            citation: "HR_Handbook.pdf | Page 12, Paragraph 5"
        },
        custom: {
            name: "Custom_Ingested_Doc.pdf",
            prompts: ["Analyze key themes", "Summarize core points"],
            queries: {
                "analyze key themes": "Based on the custom parsed vector nodes, the main thematic structure emphasizes **AI scalability, process automation, and operational overhead reduction**.",
                "summarize core points": "The ingested text outlines that incorporating AI automation modules reduces support cycles by **40%** and maximizes operational capacity."
            },
            fallback: "Your custom document has been successfully indexed in our Pinecone VectorDB. Ask about core points or key themes!",
            citation: "Custom_Ingested_Doc.pdf | Node Chunk #24"
        }
    };

    // Document switching
    docButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            docButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const docType = btn.getAttribute('data-doc');
            currentDocument = docType;

            if (docType === 'custom') {
                customUploadArea.style.display = 'block';
                documentIngested = false; // Must ingest
                btnIngest.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Ingest & Parse Custom File`;
            } else {
                customUploadArea.style.display = 'none';
                documentIngested = true; // Pre-loaded
                btnIngest.innerHTML = `<i class="fa-solid fa-database"></i> Generate Embeddings & Index`;
                resetChat(docType);
            }
        });
    });

    // Custom Upload Area Click
    customUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            customUploadArea.innerHTML = `
                <i class="fa-solid fa-file-circle-check" style="color: var(--accent-success)"></i>
                <p style="color: var(--text-primary)">${fileName}</p>
                <span class="file-format-info">Ready for pipeline processing</span>
            `;
            ragDatabase.custom.name = fileName;
        }
    });

    // Document Ingestion Simulation
    btnIngest.addEventListener('click', () => {
        ragLogs.style.display = 'block';
        ragLogLines.innerHTML = '';
        
        const logs = [
            { text: "Initializing parsing pipeline core...", delay: 0 },
            { text: `Reading bytes from ${ragDatabase[currentDocument].name}...`, delay: 600 },
            { text: "Extracting semantic layers and cleaning tokens...", delay: 1200 },
            { text: "Splitting text into 500-token nodes (overlap: 50)...", delay: 1700 },
            { text: "Calling Gemini text-embedding-004 model...", delay: 2400 },
            { text: "Creating vector namespace inside Pinecone index...", delay: 3000 },
            { text: "Upserting 32 vectors into VectorDB...", delay: 3600 },
            { text: "Ingestion pipeline COMPLETE! Status: Active", delay: 4200 }
        ];

        logs.forEach(log => {
            setTimeout(() => {
                const line = document.createElement('div');
                line.className = 'log-line';
                line.textContent = log.text;
                ragLogLines.appendChild(line);
                ragLogLines.scrollTop = ragLogLines.scrollHeight;
                
                // On complete
                if (log.delay === 4200) {
                    documentIngested = true;
                    setTimeout(() => {
                        resetChat(currentDocument);
                    }, 500);
                }
            }, log.delay);
        });
    });

    function resetChat(docType) {
        const db = ragDatabase[docType];
        
        // Clear chat
        chatMessages.innerHTML = `
            <div class="message system">
                <p>System indexed with <strong>${db.name}</strong>. Ask me anything about this document!</p>
            </div>
        `;
        
        // Update suggested prompt buttons
        suggestedPrompts.innerHTML = '';
        db.prompts.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'suggest-btn';
            btn.textContent = p;
            btn.addEventListener('click', () => {
                chatInput.value = p;
                handleChatSubmit();
            });
            suggestedPrompts.appendChild(btn);
        });
    }

    // Suggested prompts initial binds
    document.querySelectorAll('.suggest-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            handleChatSubmit();
        });
    });

    // Chat form submit
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleChatSubmit();
    });

    function handleChatSubmit() {
        const queryText = chatInput.value.trim();
        if (!queryText) return;

        if (!documentIngested) {
            alert("Please trigger the Ingestion Pipeline first to index the document!");
            return;
        }

        // Add user message
        appendMessage('user', queryText);
        chatInput.value = '';

        // Simulate AI thinking & reply
        setTimeout(() => {
            // Typing indicator
            const typingMsg = appendMessage('ai', `<span class="pulse-dot"></span> Thinking...`);
            
            setTimeout(() => {
                typingMsg.remove();
                
                // Fetch response
                const docData = ragDatabase[currentDocument];
                const cleanQuery = queryText.toLowerCase();
                let answer = docData.fallback;
                
                // Simple keyword check
                for (const key in docData.queries) {
                    if (cleanQuery.includes(key)) {
                        answer = docData.queries[key];
                        break;
                    }
                }

                // Add AI Message with citation
                const aiMessageWrapper = document.createElement('div');
                aiMessageWrapper.className = 'message ai';
                
                const answerText = document.createElement('p');
                answerText.innerHTML = answer;
                aiMessageWrapper.appendChild(answerText);

                const citation = document.createElement('div');
                citation.className = 'citation-box';
                citation.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Citation: ${docData.citation}`;
                citation.addEventListener('click', () => {
                    // Flash notification log
                    if (ragLogs.style.display === 'block') {
                        const citLine = document.createElement('div');
                        citLine.className = 'log-line';
                        citLine.style.color = 'var(--accent-1)';
                        citLine.textContent = `Retrieved context chunk from: ${docData.citation}`;
                        ragLogLines.appendChild(citLine);
                        ragLogLines.scrollTop = ragLogLines.scrollHeight;
                    }
                });
                aiMessageWrapper.appendChild(citation);

                chatMessages.appendChild(aiMessageWrapper);
                chatMessages.scrollTop = chatMessages.scrollHeight;

            }, 1000);
        }, 400);
    }

    function appendMessage(sender, text) {
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        msg.innerHTML = sender === 'user' ? `<p>${text}</p>` : text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msg;
    }


    // ==========================================================================
    // Demo 2: Multimodal Campaign Studio & Generative Canvas
    // ==========================================================================
    const btnGenerateCampaign = document.getElementById('btn-generate-campaign');
    const campaignLoading = document.getElementById('campaign-loading');
    const vibeBadge = document.getElementById('vibe-badge');
    const outputHeadline = document.getElementById('output-headline');
    const outputTagline = document.getElementById('output-tagline');
    const outputBody = document.getElementById('output-body');
    const creativeCanvas = document.getElementById('creative-canvas');
    const canvasContext = creativeCanvas.getContext('2d');

    // Pre-draw an initial gorgeous futuristic abstract background
    drawCanvasArt('cyberpunk', 'AuraGlass');

    btnGenerateCampaign.addEventListener('click', () => {
        const prodName = document.getElementById('product-name').value.trim() || "AuraGlass";
        const prodDesc = document.getElementById('product-desc').value.trim() || "AI integrations";
        const vibe = document.getElementById('campaign-vibe').value;

        // Show loading state
        campaignLoading.style.display = 'flex';

        setTimeout(() => {
            campaignLoading.style.display = 'none';

            // Update badge & texts based on Vibe and Input
            vibeBadge.textContent = vibe;
            
            if (vibe === 'cyberpunk') {
                outputHeadline.textContent = `${prodName}: Unleash the Cyber Kinetic Edge`;
                outputTagline.textContent = `Smart neural hardware for modern digital renegades.`;
                outputBody.textContent = `Experience the integration of advanced sensory metrics. Built to synergize with ${prodDesc}. Designed for high performance, glowing aesthetics, and low-latency environments.`;
                vibeBadge.style.background = 'rgba(155, 81, 224, 0.1)';
                vibeBadge.style.borderColor = 'rgba(155, 81, 224, 0.3)';
                vibeBadge.style.color = 'var(--accent-2)';
            } else if (vibe === 'minimalist') {
                outputHeadline.textContent = `The Essence of Pure Clarity: ${prodName}`;
                outputTagline.textContent = `Refined efficiency. Zero clutter. Pure performance.`;
                outputBody.textContent = `A masterclass in restraint and performance. Tailored beautifully to support ${prodDesc}. Crafted using anodized architecture and clean glass panels that adapt silently to your workspace.`;
                vibeBadge.style.background = 'rgba(0, 242, 254, 0.1)';
                vibeBadge.style.borderColor = 'rgba(0, 242, 254, 0.3)';
                vibeBadge.style.color = 'var(--accent-1)';
            } else {
                outputHeadline.textContent = `${prodName}: Accelerate Your Prime Potential`;
                outputTagline.textContent = `Propulsive design for high-velocity visionaries.`;
                outputBody.textContent = `Dynamism built directly into every single frame. Engineered specifically for ${prodDesc}. Move seamlessly through high-energy cycles with real-time feedback loops.`;
                vibeBadge.style.background = 'rgba(0, 230, 118, 0.1)';
                vibeBadge.style.borderColor = 'rgba(0, 230, 118, 0.3)';
                vibeBadge.style.color = 'var(--accent-success)';
            }

            // Draw customized high-end abstract design on canvas!
            drawCanvasArt(vibe, prodName);

        }, 1500);
    });

    // Programmatically render stunning premium vector patterns on the fly
    function drawCanvasArt(theme, label) {
        const w = creativeCanvas.width;
        const h = creativeCanvas.height;
        
        // Reset
        canvasContext.clearRect(0, 0, w, h);
        
        // Draw Dark Background
        canvasContext.fillStyle = '#06050c';
        canvasContext.fillRect(0, 0, w, h);

        if (theme === 'cyberpunk') {
            // Draw neon grids & cyber shapes
            canvasContext.strokeStyle = 'rgba(155, 81, 224, 0.15)';
            canvasContext.lineWidth = 1;
            
            // Grid
            for (let i = 0; i < w; i += 30) {
                canvasContext.beginPath();
                canvasContext.moveTo(i, 0);
                canvasContext.lineTo(i, h);
                canvasContext.stroke();
            }
            for (let j = 0; j < h; j += 30) {
                canvasContext.beginPath();
                canvasContext.moveTo(0, j);
                canvasContext.lineTo(w, j);
                canvasContext.stroke();
            }

            // Glowing concentric circles
            let gradCircle = canvasContext.createRadialGradient(w/2, h/2, 20, w/2, h/2, 180);
            gradCircle.addColorStop(0, 'rgba(0, 242, 254, 0.2)');
            gradCircle.addColorStop(0.5, 'rgba(155, 81, 224, 0.08)');
            gradCircle.addColorStop(1, 'rgba(6, 5, 12, 0)');
            
            canvasContext.fillStyle = gradCircle;
            canvasContext.beginPath();
            canvasContext.arc(w/2, h/2, 180, 0, Math.PI * 2);
            canvasContext.fill();

            // Neon cyan polygon lines
            canvasContext.strokeStyle = '#00f2fe';
            canvasContext.lineWidth = 2.5;
            canvasContext.shadowColor = '#00f2fe';
            canvasContext.shadowBlur = 15;
            canvasContext.beginPath();
            canvasContext.moveTo(w/2 - 100, h/2 - 40);
            canvasContext.lineTo(w/2 + 100, h/2 - 40);
            canvasContext.lineTo(w/2 + 130, h/2 + 20);
            canvasContext.lineTo(w/2 - 130, h/2 + 20);
            canvasContext.closePath();
            canvasContext.stroke();
            
            // Neon Purple accents
            canvasContext.strokeStyle = '#9b51e0';
            canvasContext.shadowColor = '#9b51e0';
            canvasContext.beginPath();
            canvasContext.arc(w/2, h/2 - 10, 45, 0, Math.PI * 2);
            canvasContext.stroke();

        } else if (theme === 'minimalist') {
            // Elegant linear gradients and soft minimal frames
            let gradBack = canvasContext.createLinearGradient(0, 0, w, h);
            gradBack.addColorStop(0, '#100f24');
            gradBack.addColorStop(1, '#080710');
            canvasContext.fillStyle = gradBack;
            canvasContext.fillRect(0, 0, w, h);

            // Sleek white-cyan gradient arc
            let gradArc = canvasContext.createLinearGradient(0, 0, w, 0);
            gradArc.addColorStop(0.2, '#00f2fe');
            gradArc.addColorStop(0.8, '#f3f1f9');
            
            canvasContext.strokeStyle = gradArc;
            canvasContext.lineWidth = 4;
            canvasContext.shadowColor = '#00f2fe';
            canvasContext.shadowBlur = 10;
            canvasContext.beginPath();
            canvasContext.arc(w/2, h/2 + 60, 100, Math.PI, 0, false);
            canvasContext.stroke();

            // Intersecting white minimal line
            canvasContext.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            canvasContext.lineWidth = 1;
            canvasContext.shadowBlur = 0;
            canvasContext.beginPath();
            canvasContext.moveTo(w/2 - 150, h/2 + 20);
            canvasContext.lineTo(w/2 + 150, h/2 + 20);
            canvasContext.stroke();

        } else {
            // High energy dynamic polygons & athletic vector waves
            let gradBack = canvasContext.createLinearGradient(0, 0, 0, h);
            gradBack.addColorStop(0, '#06050c');
            gradBack.addColorStop(1, '#0e1d15');
            canvasContext.fillStyle = gradBack;
            canvasContext.fillRect(0, 0, w, h);

            // Neon green energy waveforms
            canvasContext.strokeStyle = '#00e676';
            canvasContext.lineWidth = 3;
            canvasContext.shadowColor = '#00e676';
            canvasContext.shadowBlur = 12;
            
            canvasContext.beginPath();
            for (let x = 50; x < w - 50; x += 10) {
                let y = h/2 + Math.sin(x * 0.03) * 35;
                if (x === 50) {
                    canvasContext.moveTo(x, y);
                } else {
                    canvasContext.lineTo(x, y);
                }
            }
            canvasContext.stroke();

            // Triangles representing kinetic force
            canvasContext.fillStyle = 'rgba(0, 242, 254, 0.1)';
            canvasContext.shadowBlur = 0;
            canvasContext.beginPath();
            canvasContext.moveTo(w/2 - 60, h/2 + 10);
            canvasContext.lineTo(w/2, h/2 - 70);
            canvasContext.lineTo(w/2 + 60, h/2 + 10);
            canvasContext.closePath();
            canvasContext.fill();
        }

        // Add Product Label Text on Image Bottom
        canvasContext.shadowColor = 'transparent';
        canvasContext.shadowBlur = 0;
        canvasContext.fillStyle = 'rgba(255, 255, 255, 0.85)';
        canvasContext.font = "bold 20px 'Orbitron', sans-serif";
        canvasContext.textAlign = "center";
        canvasContext.fillText(label.toUpperCase(), w / 2, h - 35);
    }


    // ==========================================================================
    // Demo 3: Visual Workflow Automation Engine
    // ==========================================================================
    const btnTriggerWorkflow = document.getElementById('btn-trigger-workflow');
    const wLogs = document.getElementById('workflow-logs');
    const wLogLines = document.getElementById('workflow-log-lines');
    const pulseIndicator = document.getElementById('graph-pulse-indicator');
    
    // Nodes
    const nWebhook = document.getElementById('node-webhook');
    const nClassifier = document.getElementById('node-classifier');
    const nResponse = document.getElementById('node-response');
    const nNotify = document.getElementById('node-notify');

    const nodesArr = [
        { node: nWebhook, log: "Webhook caught JSON payload from Lead-Hook interface successfully.", status: "Webhook Captured" },
        { node: nClassifier, log: "AI Lead Classifier analyzed inquiry. Identified intent: 'Enterprise Custom Chatbot'. Score: High Priority (Budget: $12k).", status: "Intent Classified" },
        { node: nResponse, log: "Claude-3.5-Sonnet drafted detailed project scope, milestones, and initial personalized response email.", status: "Proposal Drafted" },
        { node: nNotify, log: "CRM updated with status: Qualified Lead. Triggered Slack Webhook alert: '🚀 High value lead Sophia Reynolds captured!'", status: "Slack Alerts Sent" }
    ];

    btnTriggerWorkflow.addEventListener('click', () => {
        // Reset Nodes States
        nodesArr.forEach(n => {
            n.node.className = "node-wrapper";
            n.node.querySelector('.node-status').innerHTML = `<i class="fa-regular fa-circle"></i>`;
        });
        
        wLogs.style.display = 'block';
        wLogLines.innerHTML = '';
        pulseIndicator.style.display = 'flex';

        executeNodeStep(0);
    });

    function executeNodeStep(index) {
        if (index >= nodesArr.length) {
            pulseIndicator.style.display = 'none';
            // Complete log line
            const completeLine = document.createElement('div');
            completeLine.className = 'log-line';
            completeLine.style.color = 'var(--accent-1)';
            completeLine.textContent = "Pipeline execution fully completed. System idling.";
            wLogLines.appendChild(completeLine);
            wLogLines.scrollTop = wLogLines.scrollHeight;
            return;
        }

        const step = nodesArr[index];
        step.node.classList.add('active');

        // Add start operation log
        const startLine = document.createElement('div');
        startLine.className = 'log-line warn';
        startLine.textContent = `Running module: ${step.node.querySelector('h5').textContent}...`;
        wLogLines.appendChild(startLine);
        wLogLines.scrollTop = wLogLines.scrollHeight;

        setTimeout(() => {
            // Update node to success state
            step.node.classList.remove('active');
            step.node.classList.add('success');
            step.node.querySelector('.node-status').innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
            
            // Update node subtext dynamically
            step.node.querySelector('span').textContent = step.status;

            // Output success log
            const successLine = document.createElement('div');
            successLine.className = 'log-line';
            successLine.textContent = step.log;
            wLogLines.appendChild(successLine);
            wLogLines.scrollTop = wLogLines.scrollHeight;

            // Trigger next step
            executeNodeStep(index + 1);

        }, 1800); // 1.8s delay per node to let the user see the gorgeous pulse transition
    }


    // ==========================================================================
    // Master Freelance Kit: Copy to Clipboard Functions
    // ==========================================================================
    const copyButtons = document.querySelectorAll('.btn-copy');

    copyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-copy-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const textToCopy = targetElement.textContent.trim();
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `<i class="fa-solid fa-clipboard-check" style="color: var(--accent-success)"></i> Copied!`;
                    btn.classList.add('copied');
                    
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error("Failed to copy: ", err);
                });
            }
        });
    });


    // ==========================================================================
    // Contact Form Ingest Simulation
    // ==========================================================================
    const contactForm = document.getElementById('contact-form');
    const formSuccessAlert = document.getElementById('form-success');
    const btnSubmitContact = document.getElementById('btn-submit-contact');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        btnSubmitContact.disabled = true;
        btnSubmitContact.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting to CRM pipeline...`;

        setTimeout(() => {
            btnSubmitContact.style.display = 'none';
            formSuccessAlert.style.display = 'flex';
            
            // Clear inputs
            contactForm.reset();
        }, 1500);
    });
});
