class UserFetcher {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

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
                status: 'N/A',
                outTime: 'N/A',
                duration: 'N/A',
                returnTime: 'N/A'
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    async generateRandomUsers(count) {
        const users = await this.fetchUsers();
        return users.slice(0, count);
    }
}

class UserTable {
    constructor(tableElement) {
        this.tableElement = tableElement;
        this.selectedRow = null;
    }

    populateTable(users) {
        const tbody = this.tableElement.querySelector('tbody');
        tbody.innerHTML = ''; // Clear existing rows

        users.forEach(user => {
            const row = document.createElement('tr');
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
    }

    selectRow(row) {
        if (this.selectedRow) {
            this.selectedRow.classList.remove('table-primary');
            this.selectedRow.style.backgroundColor = ''; // Reset background color
        }
        this.selectedRow = row;
        this.selectedRow.classList.add('table-primary');
        this.selectedRow.style.backgroundColor = '#d1ecf1'; // Change background color
    }
}

// Initialize
const apiUrl = 'https://randomuser.me/api/?results=10';
const tableElement = document.querySelector('.table');
const userFetcher = new UserFetcher(apiUrl);
const userTable = new UserTable(tableElement);

(async () => {
    const users = await userFetcher.generateRandomUsers(5); // Generate 5 random users
    userTable.populateTable(users);
})();
