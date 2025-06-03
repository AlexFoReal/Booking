console.log("Script loaded!");

document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('booking-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const timeSlotSelect = document.getElementById('time-slot-select');
    const timeSlotsUl = document.querySelector('#time-slots-container ul');
    const messageContainer = document.getElementById('message-container');
    const submitButton = bookingForm ? bookingForm.querySelector('button[type="submit"]') : null;

    const availableSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"];
    let messageTimeout;

    function displayMessage(message, type = 'info') { // Default type is 'info'
        if (messageContainer) {
            messageContainer.textContent = message;
            // Simpler class assignment: remove all then add the specific one.
            messageContainer.className = ''; // Clear existing classes first
            messageContainer.classList.add('message-' + type); // Applies 'message-info', 'message-success', or 'message-error'

            if (messageTimeout) {
                clearTimeout(messageTimeout);
            }
            messageTimeout = setTimeout(() => {
                messageContainer.textContent = '';
                messageContainer.className = ''; // Clear all classes
            }, 5000);
        }
        // Console logging
        if (type === 'error') console.error(message);
        else if (type === 'success') console.log(message);
        else console.log(message); // Includes 'info'
    }

    function setFormEnabled(enabled) {
        if (!bookingForm || !submitButton) return;
        nameInput.disabled = !enabled;
        emailInput.disabled = !enabled;
        timeSlotSelect.disabled = !enabled;
        submitButton.disabled = !enabled;
        if (!enabled) {
            submitButton.textContent = "No Slots Available";
        } else {
            submitButton.textContent = "Book Now";
        }
    }

    function populateTimeSlots() {
        if (!timeSlotsUl || !timeSlotSelect) {
            console.error("Time slot display elements not found.");
            return;
        }

        let bookings = [];
        try {
            const storedBookings = localStorage.getItem('bookings');
            if (storedBookings) {
                bookings = JSON.parse(storedBookings);
            }
        } catch (e) {
            console.error('Error reading bookings:', e);
        }

        const bookedTimeSlots = bookings.map(booking => booking.timeSlot);
        timeSlotsUl.innerHTML = '';
        timeSlotSelect.innerHTML = ''; // Clear previous options

        let uniqueBookedCount = new Set(bookedTimeSlots.filter(slot => availableSlots.includes(slot))).size;
        const allEffectivelyBooked = uniqueBookedCount >= availableSlots.length;

        if (availableSlots.length === 0) {
            const li = document.createElement('li');
            li.textContent = "Time slot configuration error.";
            li.classList.add('no-slots-message');
            timeSlotsUl.appendChild(li);
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No slots configured";
            option.disabled = true;
            timeSlotSelect.appendChild(option);
            setFormEnabled(false);
            return;
        } else if (allEffectivelyBooked) {
            const li = document.createElement('li');
            li.textContent = "No time slots currently available.";
            li.classList.add('no-slots-message');
            timeSlotsUl.appendChild(li);
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No slots available";
            option.disabled = true;
            timeSlotSelect.appendChild(option);
            setFormEnabled(false);
            return;
        }

        // If we reach here, there are available slots
        setFormEnabled(true);
        const defaultOption = document.createElement('option');
        defaultOption.value = ""; // Important: value is empty for the default placeholder
        defaultOption.textContent = "Select a time slot..."; // More descriptive
        defaultOption.selected = true;
        // defaultOption.disabled = true; // Not strictly necessary if value is "" and validated, but good practice
        timeSlotSelect.appendChild(defaultOption);

        availableSlots.forEach(slot => {
            const isBooked = bookedTimeSlots.includes(slot);
            const li = document.createElement('li');
            li.textContent = slot;
            if (isBooked) {
                li.classList.add('booked');
            }
            timeSlotsUl.appendChild(li);

            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot;
            if (isBooked) {
                option.disabled = true;
            }
            timeSlotSelect.appendChild(option);
        });

        // Reset selection if previously selected slot is no longer valid or available
        if (timeSlotSelect.value && timeSlotSelect.options[timeSlotSelect.selectedIndex].disabled) {
             timeSlotSelect.value = ""; // Resets to the default "Select a time slot..."
        }
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const nameValue = nameInput.value.trim();
            const emailValue = emailInput.value.trim();
            const timeSlotValue = timeSlotSelect.value;

            // Improved time slot selection validation
            if (!timeSlotValue) { // Checks if value is "" (empty string)
                displayMessage('Please select a time slot.', 'error');
                return;
            }
            if (!nameValue) { displayMessage('Name is required.', 'error'); return; }
            if (!emailValue) { displayMessage('Email is required.', 'error'); return; }
            if (!emailValue.includes('@') || !emailValue.includes('.')) { displayMessage('Invalid email format.', 'error'); return; }
            // The previous check for !timeSlotValue also covers the case where it might be null or undefined.

            const booking = { name: nameValue, email: emailValue, timeSlot: timeSlotValue, bookingId: Date.now() };
            let bookings = [];
            try {
                const storedBookings = localStorage.getItem('bookings');
                if (storedBookings) bookings = JSON.parse(storedBookings);
            } catch (e) { displayMessage('Error reading bookings.', 'error'); bookings = []; }

            bookings.push(booking);

            try {
                localStorage.setItem('bookings', JSON.stringify(bookings));
                displayMessage(`Booking successful for ${nameValue} at ${timeSlotValue}!`, 'success');
                nameInput.value = '';
                emailInput.value = '';
                populateTimeSlots();
            } catch (e) { displayMessage('Error saving booking.', 'error'); }
        });
    } else {
        console.error('Booking form not found.');
    }

    populateTimeSlots(); // Initial population
});
