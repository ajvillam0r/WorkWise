/**
 * Behavioral Tracking for Security Analysis
 * Collects user interaction patterns for fraud detection
 */

class BehavioralTracker {
    constructor() {
        this.isTracking = false;
        this.behaviorData = {
            typing: {
                keystrokes: [],
                speed: 0,
                pauses: [],
                typos: []
            },
            mouse: {
                movements: [],
                clicks: [],
                scrolls: []
            },
            interaction: {
                formStartTime: null,
                focusTime: 0,
                tabSwitches: 0,
                pageVisibility: 'visible'
            }
        };
        
        this.startTime = Date.now();
        this.lastKeystroke = null;
        this.keystrokeBuffer = [];
        this.mouseBuffer = [];
        
        this.init();
    }

    init() {
        if (this.isTracking) return;
        
        this.isTracking = true;
        this.attachEventListeners();
        this.startVisibilityTracking();
    }

    attachEventListeners() {
        // Typing pattern tracking
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Mouse behavior tracking
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Form interaction tracking
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
        
        // Page visibility tracking
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Form submission tracking
        document.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    handleKeyDown(event) {
        const now = Date.now();
        
        if (this.lastKeystroke) {
            const timeDiff = now - this.lastKeystroke;
            this.behaviorData.typing.pauses.push(timeDiff);
        }
        
        this.keystrokeBuffer.push({
            key: event.key,
            timestamp: now,
            keyCode: event.keyCode,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey
        });
        
        this.lastKeystroke = now;
        
        // Keep buffer size manageable
        if (this.keystrokeBuffer.length > 100) {
            this.keystrokeBuffer = this.keystrokeBuffer.slice(-50);
        }
    }

    handleKeyUp(event) {
        // Calculate typing speed (WPM)
        if (this.keystrokeBuffer.length >= 10) {
            const recentKeystrokes = this.keystrokeBuffer.slice(-10);
            const timeSpan = recentKeystrokes[recentKeystrokes.length - 1].timestamp - recentKeystrokes[0].timestamp;
            const wordsPerMinute = (recentKeystrokes.length / 5) / (timeSpan / 60000);
            this.behaviorData.typing.speed = Math.round(wordsPerMinute);
        }
    }

    handleMouseMove(event) {
        const now = Date.now();
        
        // Sample mouse movements (not every single movement to avoid performance issues)
        if (this.mouseBuffer.length === 0 || now - this.mouseBuffer[this.mouseBuffer.length - 1].timestamp > 100) {
            this.mouseBuffer.push({
                x: event.clientX,
                y: event.clientY,
                timestamp: now
            });
            
            // Keep buffer size manageable
            if (this.mouseBuffer.length > 50) {
                this.mouseBuffer = this.mouseBuffer.slice(-25);
            }
        }
    }

    handleClick(event) {
        this.behaviorData.mouse.clicks.push({
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now(),
            target: event.target.tagName,
            button: event.button
        });
    }

    handleScroll(event) {
        this.behaviorData.mouse.scrolls.push({
            scrollY: window.scrollY,
            timestamp: Date.now()
        });
    }

    handleFocusIn(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            this.behaviorData.interaction.formStartTime = Date.now();
        }
    }

    handleFocusOut(event) {
        if (this.behaviorData.interaction.formStartTime) {
            const interactionTime = Date.now() - this.behaviorData.interaction.formStartTime;
            this.behaviorData.interaction.focusTime += interactionTime;
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.behaviorData.interaction.tabSwitches++;
            this.behaviorData.interaction.pageVisibility = 'hidden';
        } else {
            this.behaviorData.interaction.pageVisibility = 'visible';
        }
    }

    handleFormSubmit(event) {
        // Attach behavioral data to form submission
        const form = event.target;
        const behaviorInput = document.createElement('input');
        behaviorInput.type = 'hidden';
        behaviorInput.name = 'behavioral_data';
        behaviorInput.value = JSON.stringify(this.getBehaviorSummary());
        form.appendChild(behaviorInput);
    }

    getBehaviorSummary() {
        const now = Date.now();
        const sessionDuration = now - this.startTime;
        
        return {
            typing_data: {
                speed: this.behaviorData.typing.speed,
                keystroke_count: this.keystrokeBuffer.length,
                avg_pause_time: this.calculateAveragePause(),
                typing_rhythm: this.analyzeTypingRhythm(),
                device_type: this.detectDeviceType()
            },
            mouse_movements: {
                movement_count: this.mouseBuffer.length,
                click_count: this.behaviorData.mouse.clicks.length,
                scroll_count: this.behaviorData.mouse.scrolls.length,
                movement_pattern: this.analyzeMousePattern()
            },
            form_interaction_time: this.behaviorData.interaction.focusTime,
            session_duration: sessionDuration,
            tab_switches: this.behaviorData.interaction.tabSwitches,
            page_focus_percentage: this.calculateFocusPercentage()
        };
    }

    calculateAveragePause() {
        const pauses = this.behaviorData.typing.pauses;
        if (pauses.length === 0) return 0;
        
        const sum = pauses.reduce((a, b) => a + b, 0);
        return Math.round(sum / pauses.length);
    }

    analyzeTypingRhythm() {
        const pauses = this.behaviorData.typing.pauses;
        if (pauses.length < 5) return 'insufficient_data';
        
        const variance = this.calculateVariance(pauses);
        
        if (variance < 1000) return 'very_consistent';
        if (variance < 5000) return 'consistent';
        if (variance < 15000) return 'variable';
        return 'highly_variable';
    }

    analyzeMousePattern() {
        if (this.mouseBuffer.length < 10) return 'insufficient_data';
        
        const movements = this.mouseBuffer;
        let totalDistance = 0;
        let sharpTurns = 0;
        
        for (let i = 1; i < movements.length; i++) {
            const prev = movements[i - 1];
            const curr = movements[i];
            
            const distance = Math.sqrt(
                Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
            );
            totalDistance += distance;
            
            // Detect sharp turns (potential bot behavior)
            if (i > 1) {
                const prevPrev = movements[i - 2];
                const angle1 = Math.atan2(prev.y - prevPrev.y, prev.x - prevPrev.x);
                const angle2 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
                const angleDiff = Math.abs(angle1 - angle2);
                
                if (angleDiff > Math.PI / 2) {
                    sharpTurns++;
                }
            }
        }
        
        const avgDistance = totalDistance / movements.length;
        const sharpTurnRatio = sharpTurns / movements.length;
        
        return {
            avg_movement_distance: Math.round(avgDistance),
            sharp_turn_ratio: Math.round(sharpTurnRatio * 100) / 100,
            movement_smoothness: sharpTurnRatio < 0.1 ? 'smooth' : 'erratic'
        };
    }

    detectDeviceType() {
        const userAgent = navigator.userAgent;
        
        if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            return 'tablet';
        }
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }

    calculateFocusPercentage() {
        const sessionDuration = Date.now() - this.startTime;
        if (sessionDuration === 0) return 100;
        
        // This is a simplified calculation
        // In reality, you'd track actual focus/blur events more precisely
        const focusTime = sessionDuration - (this.behaviorData.interaction.tabSwitches * 5000); // Assume 5s per tab switch
        return Math.max(0, Math.min(100, Math.round((focusTime / sessionDuration) * 100)));
    }

    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    }

    // Method to manually get current behavior data (for AJAX requests)
    getCurrentBehaviorData() {
        return this.getBehaviorSummary();
    }

    // Method to reset tracking data
    reset() {
        this.behaviorData = {
            typing: { keystrokes: [], speed: 0, pauses: [], typos: [] },
            mouse: { movements: [], clicks: [], scrolls: [] },
            interaction: { formStartTime: null, focusTime: 0, tabSwitches: 0, pageVisibility: 'visible' }
        };
        this.startTime = Date.now();
        this.keystrokeBuffer = [];
        this.mouseBuffer = [];
    }

    // Method to stop tracking
    stop() {
        this.isTracking = false;
        // Remove event listeners if needed
    }
}

// Initialize behavioral tracker when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.behavioralTracker === 'undefined') {
        window.behavioralTracker = new BehavioralTracker();
    }
});

// Export for use in other modules
export default BehavioralTracker;
