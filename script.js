class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.setupEventListeners();
        this.renderTasks();
    }

    setupEventListeners() {
        // Add Task Button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openModal();
        });
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('priorityFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Keep your existing event listeners

        // Form Submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Cancel and Close Buttons
        document.getElementById('cancelTask').addEventListener('click', () => {
            this.closeModal();
        });
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Search Functionality with debounce
        let searchTimeout;
        document.querySelector('.search-bar input').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterTasks(e.target.value);
            }, 300);
        });
    }

    openModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('taskForm');

        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            modalTitle.textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
        } else {
            modalTitle.textContent = 'Add New Task';
            form.reset();
            document.getElementById('taskId').value = '';
        }

        modal.style.display = 'block';
        requestAnimationFrame(() => {
            modal.classList.add('active');
            document.getElementById('taskTitle').focus();
        });
    }

    closeModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.getElementById('taskForm').reset();
        }, 300);
    }
    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const searchTerm = document.querySelector('.search-bar input').value.toLowerCase();
        
        const taskElements = document.querySelectorAll('.task-card');
        
        taskElements.forEach(element => {
            const title = element.querySelector('.task-title').textContent.toLowerCase();
            const description = element.querySelector('.task-description').textContent.toLowerCase();
            const status = element.classList.contains('completed') ? 'completed' : 'pending';
            const priority = element.querySelector('.priority-badge').textContent.toLowerCase();
            
            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || priority.includes(priorityFilter);
            const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
            
            if (matchesStatus && matchesPriority && matchesSearch) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });
    }
    
    clearFilters() {
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('priorityFilter').value = 'all';
        document.querySelector('.search-bar input').value = '';
        this.applyFilters();
    }
    
    // Modify your existing filterTasks method to use applyFilters
    filterTasks(searchTerm) {
        this.applyFilters();
    }
    saveTask() {
        const id = document.getElementById('taskId').value;
        const task = {
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim(),
            priority: document.getElementById('taskPriority').value,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        if (id) {
            const index = this.tasks.findIndex(t => t.id === parseInt(id));
            task.id = parseInt(id);
            task.updatedAt = new Date().toISOString();
            this.tasks[index] = task;
        } else {
            task.id = Date.now();
            this.tasks.unshift(task); // Add to beginning of array
        }

        this.saveTasks();
        this.renderTasks();
        this.closeModal();
        this.showNotification(id ? 'Task updated successfully!' : 'New task added!');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification slide-up';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task deleted successfully!');
        }
    }

    toggleTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = task.status === 'pending' ? 'completed' : 'pending';
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.showNotification(`Task marked as ${task.status}!`);
        }
    }

    filterTasks(searchTerm) {
        const term = searchTerm.toLowerCase();
        const taskElements = document.querySelectorAll('.task-card');
        
        taskElements.forEach(element => {
            const title = element.querySelector('.task-title').textContent.toLowerCase();
            const description = element.querySelector('.task-description').textContent.toLowerCase();
            
            if (title.includes(term) || description.includes(term)) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.updateStats();
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = total - completed;

        // Animate number changes
        this.animateNumber('totalTasks', total);
        this.animateNumber('completedTasks', completed);
        this.animateNumber('pendingTasks', pending);
    }

    animateNumber(elementId, target) {
        const element = document.getElementById(elementId);
        const start = parseInt(element.textContent);
        const duration = 500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const current = Math.round(start + (target - start) * progress);
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card ${task.status === 'completed' ? 'completed' : ''} fade-in`;
        
        taskElement.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <span class="priority-badge priority-${task.priority}">
                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
            </div>
            <p class="task-description">${task.description || 'No description provided'}</p>
            <div class="task-meta">
                <span><i class="far fa-clock"></i> Created: ${this.formatDate(task.createdAt)}</span>
                ${task.updatedAt ? `<br><span><i class="far fa-edit"></i> Updated: ${this.formatDate(task.updatedAt)}</span>` : ''}
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="action-btn toggle-btn" title="${task.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}">
                    <i class="fas fa-${task.status === 'completed' ? 'undo' : 'check'}"></i>
                </button>
            </div>
        `;

        // Add event listeners
        taskElement.querySelector('.edit-btn').addEventListener('click', () => {
            this.openModal(task.id);
        });

        taskElement.querySelector('.delete-btn').addEventListener('click', () => {
            this.deleteTask(task.id);
        });

        taskElement.querySelector('.toggle-btn').addEventListener('click', () => {
            this.toggleTaskStatus(task.id);
        });

        return taskElement;
    }

    renderTasks() {
        const tasksContainer = document.getElementById('tasksGrid');
        tasksContainer.innerHTML = '';

        // Sort tasks by creation date (newest first)
        const sortedTasks = [...this.tasks].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        if (sortedTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state fade-in" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>No tasks yet</h3>
                    <p>Click the "Add New Task" button to get started</p>
                </div>
            `;
            return;
        }

        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });

        this.updateStats();
    }
}

// Initialize task manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
