/**
 * Class responsible for fetching user data from an API.
 */
class UserFetcher {
    /**
     * @param {string} apiUrl - The URL of the API to fetch users from.
     */
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    /**
     * Fetches users from the API and processes their data.
     * @returns {Promise<Array>} A promise that resolves to an array of user objects.
     */
    async fetchUsers() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.results.map(user => ({
                picture: user.picture.medium,
                name: user.name.first,
                surname: user.name.last,
                email: user.email,
                status: 'In', // Default status is In
                outTime: 'N/A',
                duration: 'N/A',
                returnTime: 'N/A'
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    /**
     * Generates a specified number of random users from the API.
     * @param {number} count - The number of users to generate.
     * @returns {Promise<Array>} A promise that resolves to an array of user objects.
     */
    async generateRandomUsers(count) {
        const users = await this.fetchUsers();
        return users.slice(0, count);
    }
}

/**
 * Class responsible for managing the user table and user interactions.
 */
class UserTable {
    /**
     * @param {HTMLElement} tableElement - The table element to populate with users.
     * @param {HTMLElement} inButton - The button to mark users as "In".
     * @param {HTMLElement} outButton - The button to mark users as "Out".
     */
    constructor(tableElement, inButton, outButton) {
        this.tableElement = tableElement;
        this.inButton = inButton;
        this.outButton = outButton;
        this.selectedRow = null;
        this.intervalIds = new Map(); // Track duration intervals for users

        // Bind buttons
        this.inButton.addEventListener('click', () => this.markIn());
        this.outButton.addEventListener('click', () => this.promptOut());
    }

    /**
     * Populates the table with user data.
     * @param {Array} users - The array of user objects to display in the table.
     */
    populateTable(users) {
        const tbody = this.tableElement.querySelector('tbody');
        tbody.innerHTML = ''; // Clear existing rows

        users.forEach((user, index) => {
            const row = document.createElement('tr');
            row.dataset.index = index; // Save index for tracking
            row.innerHTML = `
                <td><img src="${user.picture}" alt="Profile Picture" style="width: 50px; height: 50px;" /></td>
                <td>${user.name}</td>
                <td>${user.surname}</td>
                <td>${user.email}</td>
                <td>${user.status}</td>
                <td>${user.outTime}</td>
                <td>${user.duration}</td>
                <td>${user.returnTime}</td>
            `;

            row.addEventListener('click', () => this.selectRow(row));
            tbody.appendChild(row);
        });

        this.users = users; // Save users for later reference
    }

    /**
     * Highlights a selected row in the table.
     * @param {HTMLElement} row - The table row to select.
     */
    selectRow(row) {
        if (this.selectedRow) {
            this.selectedRow.classList.remove('table-primary');
        }
        this.selectedRow = row;
        this.selectedRow.classList.add('table-primary');
    }

    /**
     * Marks the selected user as "In".
     */
    markIn() {
        if (!this.selectedRow) {
            alert('Please select a user first.');
            return;
        }

        const index = this.selectedRow.dataset.index;
        const user = this.users[index];
        const statusCell = this.selectedRow.children[4];
        const outTimeCell = this.selectedRow.children[5];
        const durationCell = this.selectedRow.children[6];
        const returnTimeCell = this.selectedRow.children[7];

        user.status = 'In';
        statusCell.textContent = 'In';
        user.outTime = 'N/A';
        outTimeCell.textContent = 'N/A';

        clearInterval(this.intervalIds.get(user)); // Stop timer
        this.intervalIds.delete(user);

        user.duration = 'N/A';
        durationCell.textContent = 'N/A';

        user.returnTime = 'N/A'; // Clear return time
        returnTimeCell.textContent = 'N/A';
    }

    /**
     * Prompts the user for the number of minutes they will be out and marks them as "Out".
     */
    promptOut() {
        if (!this.selectedRow) {
            alert('Please select a user first.');
            return;
        }

        const durationMinutes = prompt('Enter the number of minutes the user will be out:', '0');
        if (durationMinutes === null || isNaN(durationMinutes) || durationMinutes <= 0) {
            alert('Please enter a valid positive number for minutes.');
            return;
        }

        this.markOut(parseInt(durationMinutes, 10));
    }

    /**
     * Marks the selected user as "Out" and starts a timer for their duration.
     * @param {number} durationMinutes - The number of minutes the user will be out.
     */
    markOut(durationMinutes) {
        const index = this.selectedRow.dataset.index;
        const user = this.users[index];
        const statusCell = this.selectedRow.children[4];
        const outTimeCell = this.selectedRow.children[5];
        const durationCell = this.selectedRow.children[6];

        user.status = 'Out';
        statusCell.textContent = 'Out';

        const now = new Date();
        user.outTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format as HH:mm
        outTimeCell.textContent = user.outTime;

        // Set the expected duration
        user.duration = `${durationMinutes} min`;
        durationCell.textContent = user.duration;

        // Calculate and set the return time
        const returnTime = new Date(now.getTime() + durationMinutes * 60000);
        const returnTimeCell = this.selectedRow.children[7];
        user.returnTime = returnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format as HH:mm
        returnTimeCell.textContent = user.returnTime;

        // Start duration timer
        let elapsedMinutes = 0;
        const intervalId = setInterval(() => {
            elapsedMinutes += 1;
            durationCell.textContent = `${elapsedMinutes} min`;
            if (elapsedMinutes >= durationMinutes) {
                clearInterval(intervalId);
                this.showPopup(`${user.name} ${user.surname} is expected to return now.`);
            }
        }, 60000); // Update every minute

        this.intervalIds.set(user, intervalId);
    }

    /**
     * Displays a popup warning in the top right corner with user information.
     * @param {string} message - The message to display in the popup.
     */
    showPopup(message) {
        const popup = document.createElement('div');
        popup.textContent = message;
        popup.style.position = 'fixed';
        popup.style.top = '20px';
        popup.style.right = '20px';
        popup.style.backgroundColor = '#f8d7da';
        popup.style.color = '#721c24';
        popup.style.padding = '10px';
        popup.style.border = '1px solid #f5c6cb';
        popup.style.borderRadius = '5px';
        popup.style.zIndex = '1000';

        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 5000); // Remove popup after 5 seconds
    }
}

// Initialize
const apiUrl = 'https://randomuser.me/api/?results=10';
const tableElement = document.querySelector('.table');
const inButton = document.getElementById('in');
const outButton = document.getElementById('out');
const userFetcher = new UserFetcher(apiUrl);
const userTable = new UserTable(tableElement, inButton, outButton);

(async () => {
    const users = await userFetcher.generateRandomUsers(5); // Generate 5 random users
    userTable.populateTable(users);
})();
