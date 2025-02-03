// Create the digital clock
function digitalClock() {
    const now = new Date();
            const day = now.getDate();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const month = monthNames[now.getMonth()];
            const year = now.getFullYear();
            let hours = now.getHours().toString().padStart(2, '0');
            let minutes = now.getMinutes().toString().padStart(2, '0');
            let seconds = now.getSeconds().toString().padStart(2, '0');
            
            document.getElementById('clock').textContent = `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}

setInterval(digitalClock, 1000);
digitalClock();

// Class responsible for fetching user data from an API.
class UserFetcher {
    // Fetch users from API
    // Constructor takes a string `apiUrl` as a parameter

    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    //Fetches users from the API and their data.
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
                outTime: '',
                duration: '',
                returnTime: ''
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    // Generates a specified number of random users from the API.
    async generateRandomUsers(count) {
        const users = await this.fetchUsers();
        return users.slice(0, count);
    }
}

//Class responsible for managing the user table and user interactions.

class UserTable {
    constructor(tableElement, inButton, outButton) {
        this.tableElement = tableElement;
        this.inButton = inButton;
        this.outButton = outButton;
        this.selectedRow = null;
        this.intervalIds = new Map(); // Track both duration and late timer

        // Bind buttons, In / Out
        this.inButton.addEventListener('click', () => this.staffIn());
        this.outButton.addEventListener('click', () => this.promptOut());
    }

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
                <td class="status-cell">${user.status}</td>
                <td class="out-time-cell">${user.outTime}</td>
                <td class="duration-cell">${user.duration}</td>
                <td class="return-time-cell">${user.returnTime}</td>
            `;

            row.addEventListener('click', () => this.selectRow(row));
            tbody.appendChild(row);
        });

        this.users = users; // Save users for later reference
    }

    selectRow(row) {
        if (this.selectedRow) {
            this.selectedRow.classList.remove('table-primary');
        }
        this.selectedRow = row;
        this.selectedRow.classList.add('table-primary');
    }

    staffIn() {
        if (!this.selectedRow) {
            alert('Please select a user first.');
            return;
        }
    
        const index = this.selectedRow.dataset.index;
        const user = this.users[index];
        user.status = 'In';
        user.outTime = '';
        user.duration = '';
        user.returnTime = '';
    
        clearInterval(this.intervalIds.get(user)); // Stop timer
        this.intervalIds.delete(user);
    
        // Update UI
        this.selectedRow.querySelector('.status-cell').textContent = 'In';
        this.selectedRow.querySelector('.out-time-cell').textContent = '';
        this.selectedRow.querySelector('.duration-cell').textContent = '';
        this.selectedRow.querySelector('.return-time-cell').textContent = '';
    
        this.removePopup(user.email);
    }

    removePopup(email) {
        let popup = document.querySelector(`.popup-warning[data-user="${email}"]`);
        if (popup) {
            popup.remove();
        }
    }

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

        this.staffOut(parseInt(durationMinutes, 10));
    }

    staffOut(durationMinutes) {
        if (!this.selectedRow) {
            alert('Please select a user first.');
            return;
        }

        const index = this.selectedRow.dataset.index;
        const user = this.users[index];
        user.status = 'Out';
        user.outTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        user.duration = `${durationMinutes} min`;

        const returnTime = new Date(new Date().getTime() + durationMinutes * 60000);
        user.returnTime = returnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Update UI
        this.selectedRow.querySelector('.status-cell').textContent = 'Out';
        this.selectedRow.querySelector('.out-time-cell').textContent = user.outTime;
        this.selectedRow.querySelector('.duration-cell').textContent = user.duration;
        this.selectedRow.querySelector('.return-time-cell').textContent = user.returnTime;

        let elapsedMinutes = 0;
        const intervalId = setInterval(() => {
            const now = new Date();
            if (now >= returnTime) {
                const lateMinutes = Math.floor((now - returnTime) / 60000);
                this.staffMemberIsLate(user, lateMinutes);
            } else {
                elapsedMinutes += 1;
                this.selectedRow.querySelector('.duration-cell').textContent = `${elapsedMinutes} min`;
            }
        }, 60000);
        this.intervalIds.set(user, intervalId);
    }

    staffMemberIsLate(user, lateMinutes) {
        this.removePopup(user.email);
        
        let popup = document.createElement('div');
        popup.classList.add('popup-warning');
        popup.dataset.user = user.email;
        popup.innerHTML = `
            <div>
                <button style="position: absolute; top: 5px; right: 5px; background: transparent; border: none; font-size: 16px; cursor: pointer;">&times;</button>
                <img src="${user.picture}" alt="Profile Picture" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 10px;" />
                <div>
                    <p><strong>Name:</strong> ${user.name} ${user.surname}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Late by:</strong> ${lateMinutes} min</p>
                </div>
            </div>`;

        // This will just remove the popup temporarily because of lateMinutes
        let closeButton = popup.querySelector('button');
        closeButton.addEventListener('click', () => this.removePopup(user.email));

        let container = document.querySelector('.popup-container');
        container.appendChild(popup);
    }
}


class ScheduleDelivery {
    constructor(vehicleType, nameInput, surnameInput, telephoneInput, deliveryAddressInput, returnTimeInput, submitButton, deliveryBoard, vehicleReturnedButton) {
        this.vehicleType = vehicleType;
        this.nameInput = nameInput;
        this.surnameInput = surnameInput;
        this.telephoneInput = telephoneInput;
        this.deliveryAddressInput = deliveryAddressInput;
        this.returnTimeInput = returnTimeInput;
        this.submitButton = submitButton;
        this.deliveryBoard = deliveryBoard;
        this.vehicleReturnedButton = vehicleReturnedButton;
        this.selectedRow = null;
        this.intervalIds = new Map();

        this.submitButton.addEventListener('click', () => this.handleSubmit());
        if (this.vehicleReturnedButton) {
            this.vehicleReturnedButton.addEventListener('click', () => this.returnSelectedVehicle());
        } else {
            console.error("Error: vehicleReturnedButton is missing.");
        }
        this.addRowClickEvent();
    }

    validateDelivery() {
        if (![this.vehicleType.value, this.nameInput.value.trim(), this.surnameInput.value.trim(),
                /^[0-9]{8}$/.test(this.telephoneInput.value), this.deliveryAddressInput.value.trim(), this.returnTimeInput.value].every(Boolean)) {
            alert('Please check if all fields are entered correctly.');
            return false;
        }
        return true;
    }

    handleSubmit() {
        if (!this.validateDelivery()) return;

        const now = new Date();
        const [hours, minutes] = this.returnTimeInput.value.split(':');
        const returnTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

        const deliveryData = {
            vehicleType: this.vehicleType.value,
            name: this.nameInput.value.trim(),
            surname: this.surnameInput.value.trim(),
            telephone: this.telephoneInput.value,
            deliveryAddress: this.deliveryAddressInput.value.trim(),
            returnTime: returnTime
        };

        this.addDelivery(deliveryData);
        this.trackDelivery(deliveryData);
        this.clearInputs();
        alert(`Delivery Scheduled for ${deliveryData.name} ${deliveryData.surname}`);
    }

    addDelivery(deliveryData) {
        let tbody = this.deliveryBoard.querySelector('tbody');
        if (!tbody) {
            tbody = document.createElement('tbody');
            this.deliveryBoard.appendChild(tbody);
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${deliveryData.vehicleType}</td>
            <td>${deliveryData.name}</td>
            <td>${deliveryData.surname}</td>
            <td>${deliveryData.telephone}</td>
            <td>${deliveryData.deliveryAddress}</td>
            <td>${deliveryData.returnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        `;
        row.addEventListener('click', () => this.selectRow(row));
        tbody.appendChild(row);
    }

    trackDelivery(deliveryData) {
        const returnTime = deliveryData.returnTime;
        const now = new Date();
        const delay = returnTime - now;

        if (delay > 0) {
            setTimeout(() => {
                this.deliveryDriverIsLate(deliveryData);
            }, delay);
        }
    }

    deliveryDriverIsLate(deliveryData) {
        this.removePopup(deliveryData.telephone);

        let popup = document.createElement('div');
        popup.classList.add('popup-warning');
        popup.dataset.telephone = deliveryData.telephone;
        popup.innerHTML = `
            <div>
                <button style="position: absolute; top: 5px; right: 5px; background: transparent; border: none; font-size: 16px; cursor: pointer;" onclick="this.parentElement.remove()">&times;</button>
                <p><strong>Vehicle Type:</strong> ${deliveryData.vehicleType}</p>
                <p><strong>Name:</strong> ${deliveryData.name} ${deliveryData.surname}</p>
                <p><strong>Expected Return Time:</strong> ${deliveryData.returnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p style="color: red; font-weight: bold;">Vehicle overdue!</p>
            </div>`;

        let closeButton = popup.querySelector('button');
        closeButton.addEventListener('click', () => this.removePopup(deliveryData.telephone));

        let container = document.querySelector('.popup-container');
        container.appendChild(popup);
    }

    addRowClickEvent() {
        this.deliveryBoard.addEventListener('click', (event) => {
            const row = event.target.closest('tr');
            if (row && row.parentElement.tagName === 'TBODY') {
                this.selectRow(row);
            }
        });
    }

    selectRow(row) {
        if (this.selectedRow) {
            this.selectedRow.classList.remove('table-primary');
        }
        this.selectedRow = row;
        this.selectedRow.classList.add('table-primary');
    }

    returnSelectedVehicle() {
        if (!this.selectedRow) {
            alert('Please select a row to return the vehicle.');
            return;
        }
        const telephone = this.selectedRow.cells[3].textContent;
        this.removePopup(telephone);
        this.selectedRow.remove();
        this.selectedRow = null;
    }

    removePopup(telephone) {
        let popup = document.querySelector(`.popup-warning[data-telephone="${telephone}"]`);
        if (popup) {
            popup.remove();
        }
    }

    clearInputs() {
        [this.vehicleType, this.nameInput, this.surnameInput, this.telephoneInput, this.deliveryAddressInput, this.returnTimeInput].forEach(input => input.value = '');
    }
}


// Set variables 
//Users
const apiUrl = 'https://randomuser.me/api/?results=10';
const tableElement = document.querySelector('.table');
const inButton = document.getElementById('in');
const outButton = document.getElementById('out');
const userFetcher = new UserFetcher(apiUrl);
const userTable = new UserTable(tableElement, inButton, outButton);

// Vehicle 
const vehicleType = document.getElementById('vehicleType');
const nameInput = document.getElementById('name');
const surnameInput = document.getElementById('surname');
const telephoneInput = document.getElementById('telephone');
const deliveryAddressInput = document.getElementById('deliveryAddress');
const returnTimeInput = document.getElementById('returnTime');
const scheduleButton = document.getElementById('scheduleDelivery');
const deliveryBoard = document.getElementById('deliveryBoard');
const vehicleReturnedButton = document.getElementById('vehicleReturned');

// Initialize ScheduleDelivery
const scheduleDelivery = new ScheduleDelivery(
    vehicleType, nameInput, surnameInput, telephoneInput,
    deliveryAddressInput, returnTimeInput, scheduleButton,
    deliveryBoard, vehicleReturnedButton // Pass this variable
);



(async () => {
    const users = await userFetcher.generateRandomUsers(5); // Generate 5 random users
    userTable.populateTable(users);
})();
