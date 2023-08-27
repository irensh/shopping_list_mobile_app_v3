//--------------- Firebase configuration -----------------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import {
    getDatabase,
    ref,
    push,
    update,
    set,
    remove,
    onValue
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyDnbaFl_UkeATeDr5GB2XWgbkVzcQ-wbwg",
    authDomain: "shopping-list-v2-f3771.firebaseapp.com",
    databaseURL: "https://shopping-list-v2-f3771-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "shopping-list-v2-f3771",
    storageBucket: "shopping-list-v2-f3771.appspot.com",
    messagingSenderId: "535161413517",
    appId: "1:535161413517:web:86308dcdf1e2616ec0a7c4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// -------------------- App logic ------------------------
const listsTitles = 'lists-titles';
const listsContent = 'lists-content';

const errorMessageContainer = document.querySelector(".error");
const loginDiv = document.querySelector(".login");
const signupDiv = document.querySelector(".signup");
const listsDiv = document.querySelector(".lists");
const newListIcon = document.querySelector('#add-new-list-li > img');
const newListForm = document.querySelector('#add-new-list-div');
const addNewListForm = document.querySelector('#add-new-list-form');
const menuBar = document.querySelector('.menu-bar');
const moreMenu = document.querySelector('#more ul');
const allListsUl = document.querySelector('#all-lists-ul');
const settingsContainer = document.querySelector('.settings-container');
const closeSettingsButton = document.querySelector('.close-settings');
const themeSwitches = settingsContainer.querySelectorAll('.theme');

let userID = null;
let keyOfCurrentList = '';
// let theme = 'light';

// Listen for authentication status changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        userID = user.uid;

        const listsTitlesDB = ref(db, `${user.uid}/${listsTitles}`);
        const listsItemsDB = ref(db, `${user.uid}/${listsContent}`);

        setupUI(user);

        // Render all lists of current user and listen for changes
        onValue(listsTitlesDB, (snapshot) => {
            if (snapshot.exists()) {
                const listsTitlesArray = Object.entries(snapshot.val());
                setupLists(listsTitlesArray);
            } else {
                allListsUl.innerHTML = 'No lists yet...';
            }
        });

        // Render all items in lists and listen for changes
        onValue(listsItemsDB, (snapshot) => {
            if (snapshot.exists()) {
                const listsTitlesArray = Object.entries(snapshot.val());

                listsTitlesArray.forEach(list => {
                    const listID = list[0];

                    const currentDiv = document.querySelector(`[data-id="${listID}"]`);
                    const currentShoppingListUL = currentDiv.querySelector('.shopping-list-ul');

                    const listItemsArray = Object.entries(list[1]);

                    // Render all items of current list
                    if (listItemsArray.length !== 0) {

                        currentShoppingListUL.innerHTML = '';

                        listItemsArray.forEach(item => {
                            const itemID = item[0];
                            const itemValue = item[1];

                            const li = document.createElement("li");
                            li.setAttribute('data-id', itemID);
                            li.textContent = itemValue;

                            // Again add Eventlistener to item if changes are occurred
                            if (currentShoppingListUL.parentElement.style.display === 'flex') {
                                li.addEventListener("dblclick", removeItem);
                            }

                            currentShoppingListUL.append(li);
                        });
                    } else {
                        currentShoppingListUL.innerHTML = 'No items yet...';
                    }

                });
            }
        });

    } else {
        userID = null;
        setupUI();
        setupLists([]);
    }
});

// Hide #add-new-list-div, #more ul, .list-options-ul
document.addEventListener('click', () => {
    newListForm.style.display = 'none';

    moreMenu.style.display = 'none';

    document.querySelectorAll('.list-options-ul').forEach(ul => {
        ul.style.display = 'none';
    });
});

//--------------------Login, Sign up-------------------

// View Sign up form
const viewSignupForm = document.getElementById("view-signup-form");
viewSignupForm.addEventListener("click", () => {
    displayOnlyNeedfulContainer(signupDiv);
});

// Sign up
const signupForm = document.getElementById('signup-form');
signupForm['signup-button'].addEventListener("click", (e) => {
    e.preventDefault();

    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;
    const confirmPassword = signupForm['signup-confirm-password'].value;

    if (password !== confirmPassword) {
        displayErrorMessage("Passwords Don't Match");
    } else {
        // Create User Account
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {

            })
            .catch((error) => {
                displayErrorMessage(error.message);
            });

        signupForm.reset();
    }
});

// Back to login form
const backArrowImg = document.querySelector(".back-arrow");
backArrowImg.addEventListener("click", () => {
    displayOnlyNeedfulContainer(loginDiv);
});

// Log in
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // get user data
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            loginForm.reset();
        })
        .catch(error => {
            displayErrorMessage(error.message);
        })
});

//----------------Create New list events------------------------

// Toggle Add New List Div
newListIcon.addEventListener("click", function (e) {
    e.stopPropagation();
    const allListsOption = document.querySelectorAll('.list-options-ul');

    toggleDomElement(newListForm, [moreMenu, ...allListsOption], 'block');
});

// Stop bubbling the newListIcon event
newListForm.addEventListener('click', handlerStopPropagation);

// Create new list Button
addNewListForm.addEventListener("submit", addNewList);

//-------------------------Menu bar-----------------------------

// Toggle Menu Bar
menuBar.addEventListener("click", function (e) {
    e.stopPropagation();
    const allListsOption = document.querySelectorAll('.list-options-ul');
    toggleDomElement(moreMenu, [newListForm, ...allListsOption], 'block');
});

// Stop bubbling the menuBar event
moreMenu.addEventListener('click', handlerStopPropagation);

// Add event to "Log out"(from menu bar)
const logout = document.getElementById('logout');
logout.addEventListener("click", () => {
    const logoutContainer = document.querySelector('.logout');
    const textContainer = logoutContainer.querySelector('.message > p');
    textContainer.textContent = 'Are you sure you want to log out?';

    toggleDomElement(logoutContainer, [moreMenu], 'flex');

    // Cancel Button
    const cancelButton = logoutContainer.querySelector('.close-message-btn');
    cancelButton.addEventListener('click', cancel);
    function cancel() {
        closeMessageContainers(this);
        cancelButton.removeEventListener('click', cancel);
        logoutButton.removeEventListener('click', logout);
    }

    // Log out Button
    const logoutButton = logoutContainer.querySelector('.ok-button');
    logoutButton.addEventListener('click', logout);
    function logout() {
        closeMessageContainers(this);
        cancelButton.removeEventListener('click', cancel);
        logoutButton.removeEventListener('click', logout);
        signOut(auth);
    }

});

// Account Button
const account = document.getElementById('account');
account.addEventListener('click', function () {
    const email = auth.currentUser.email;
    const accountContainer = document.querySelector('.account');
    const textContainer = accountContainer.querySelector('.message > p');
    textContainer.textContent = `You are logged in with ${email}`;

    // Display Account Container
    toggleDomElement(accountContainer, [moreMenu], 'flex');

    // Icon Close Button
    const iconClose = document.querySelector('.account .icon-close');

    function closeAccountPopUp() {
        toggleDomElement(this.parentElement.parentElement, [], 'none');
        iconClose.removeEventListener('click', closeAccountPopUp)
    }

    iconClose.addEventListener("click", closeAccountPopUp);
});

// Settings Button
const settingsButton = document.querySelector('#settings-btn');
settingsButton.addEventListener('click', function () {

    const allListsOption = document.querySelectorAll('.list-options-ul');
    toggleDomElement(settingsContainer, [moreMenu, ...allListsOption], 'block');

    // addEventListeners to all buttons
    closeSettingsButton.addEventListener('click', closeSettingsContainer);
    themeSwitches.forEach(swith => swith.addEventListener('click', switchThemeFromSettings));
});

//-------------------------Functions--------------------------

function setupUI(user) {
    if (user) {
        displayOnlyNeedfulContainer(listsDiv);
    } else {
        displayOnlyNeedfulContainer(loginDiv);
        moreMenu.style.display = 'none';
        newListForm.style.display = 'none';
    }

    // Switch theme
    if (localStorage.shoppingListTheme) {
        switchStylesheet(localStorage.shoppingListTheme);
    } else {
        localStorage.setItem('shoppingListTheme', 'light');
        switchStylesheet(localStorage.shoppingListTheme);
    }
}

function handlerStopPropagation(e) {
    e.stopPropagation();
}

function displayOnlyNeedfulContainer(renderedDiv) {
    const allDivsContainer = document.querySelectorAll('.container');

    allDivsContainer.forEach(div => {
        if (div.className === renderedDiv.className)
            div.style.display = 'flex';
        else
            div.style.display = 'none';
    });
}

// Render all lists of current user
function setupLists(listsTitlesArray) {
    let html = '';

    listsTitlesArray.forEach(list => {
        const listID = list[0];
        const listValue = list[1];
        const li = `
            <li>
                <div>
                    <span>${listValue}</span>
                    <i class="fa-solid fa-ellipsis-vertical fa-xl list-options"></i>
                    <ul class="list-options-ul" style="display: none;">
                        <li class="rename-list">Rename</li>
                        <hr>
                        <li class="delete-list">Delete</li>
                    </ul>
                </div>
                <div class="shopping-list-div" data-id="${listID}" style="display: none;">
                    <img src="./images/basket.png" class="basket" alt="basket">
                    <input type="text" class="input-field" placeholder="Bread">
                    <button class="add-button">Add to basket</button>
                    <ul class="shopping-list-ul"></ul>
                </div>
            </li>
        `;
        html += li;
    });

    allListsUl.innerHTML = html;

    // Add events to all shopping lists title
    const allShoppingTitles = document.querySelectorAll('#all-lists-ul > li div span');
    allShoppingTitles.forEach(title => {
        title.addEventListener('click', function () {
            const shoppingListDiv = this.parentElement.parentElement.childNodes[3];
            const allShoppingListDiv = document.querySelectorAll('.shopping-list-div');
            toggleDomElement(shoppingListDiv, allShoppingListDiv, 'flex');
        });
    });

    // Add events to all "Options" buttons
    const allOptionButtons = document.querySelectorAll('.list-options');
    allOptionButtons.forEach(optionButton => {
        optionButton.addEventListener('click', function (e) {
            e.stopPropagation();

            const selectedListOption = this.parentElement.querySelector('.list-options-ul');
            const allListsOption = document.querySelectorAll('.list-options-ul');

            // Stop bubbling the options event
            allListsOption.forEach(ul => {
                ul.addEventListener('click', handlerStopPropagation);
            });

            // Open/Close Options list
            toggleDomElement(selectedListOption, [newListForm, moreMenu, ...allListsOption], 'block');

        });
    });

    // Add event to "Rename"(from Options list)
    const renameListLi = document.querySelectorAll('.rename-list');
    renameListLi.forEach(li => {
        li.addEventListener('click', function () {
            viewPopUp(this, '.rename', 'Rename list');

            // Cancel Button
            const closeMessageBtn = document.querySelector('.rename .close-message-btn');
            function cancel() {
                closeMessageContainers(this);
                closeMessageBtn.removeEventListener('click', cancel);
                renameBtn.removeEventListener('click', rename);
                keyOfCurrentList = '';
            }
            closeMessageBtn.addEventListener('click', cancel);

            // Rename button
            const renameBtn = document.querySelector('.rename .ok-button');
            function rename() {
                const newTitle = this.parentElement.parentElement.querySelector('input').value;
                const renamedListRef = ref(db, `${userID}/${listsTitles}/${keyOfCurrentList}`);

                if (newTitle.length > 0) {
                    set(renamedListRef, newTitle);
                    closeMessageContainers(this);

                    closeMessageBtn.removeEventListener('click', cancel);
                    renameBtn.removeEventListener('click', rename);
                    keyOfCurrentList = '';
                }

            }
            renameBtn.addEventListener('click', rename);
        });
    });

    // Add event to "Delete"(from Options list)
    const deleteListLi = document.querySelectorAll('.delete-list');
    deleteListLi.forEach(li => {
        li.addEventListener('click', function () {
            viewPopUp(this, '.delete', 'Delete list');

            // Cancel Button
            const closeMessageBtn = document.querySelector('.delete .close-message-btn');
            function cancel() {
                closeMessageContainers(this);
                closeMessageBtn.removeEventListener('click', cancel);
                deleteBtn.removeEventListener('click', deleteList);
                keyOfCurrentList = '';
            }
            closeMessageBtn.addEventListener('click', cancel);

            // Delete button
            const deleteBtn = document.querySelector('.delete .ok-button');
            function deleteList() {
                const deletedListRef = ref(db, `${userID}/${listsTitles}/${keyOfCurrentList}`);
                const deletedListContentRef = ref(db, `${userID}/${listsContent}/${keyOfCurrentList}`);

                remove(deletedListRef);
                remove(deletedListContentRef);

                closeMessageContainers(this);

                closeMessageBtn.removeEventListener('click', cancel);
                deleteBtn.removeEventListener('click', deleteList);
                keyOfCurrentList = '';
            }
            deleteBtn.addEventListener('click', deleteList);
        });
    });

    function viewPopUp(li, classOfPopUpContainer, partOFTitle) {
        const listTitleSpan = li.parentElement.parentElement.querySelector('span');
        const listLi = li.parentElement;
        const popUpBox = document.querySelector(`${classOfPopUpContainer}`);

        // Get listID from DOM
        keyOfCurrentList = li
            .parentElement
            .parentElement
            .parentElement
            .querySelector('.shopping-list-div').dataset.id;

        // Render title in Pop Up Box
        document.querySelector(`${classOfPopUpContainer} .message p`).textContent = `
            ${partOFTitle} "${listTitleSpan.textContent}"
        `;

        //View Pop up box
        toggleDomElement(popUpBox, [], 'flex');
        toggleDomElement(listLi, [], 'none');
    }
}

function addNewList(e) {
    e.preventDefault();

    const listTitleValue = addNewListForm.querySelector('input').value;
    const usersDB = ref(db, `${userID}/${listsTitles}`);

    //Create new list and get the key
    const newListTitleKey = push(usersDB, listTitleValue).key;

    //Create list items for current list
    const listItemsRef = ref(db, `${userID}/${listsContent}`);
    update(listItemsRef, { [newListTitleKey]: "" });


    addNewListForm.reset();

    const allListsOption = document.querySelectorAll('.list-options-ul');
    toggleDomElement(newListForm, [moreMenu, ...allListsOption], 'block');
}

function addNewItem() {
    const selectedListID = this.parentElement.dataset.id;
    const pathToSelectedList = `${userID}/${listsContent}/${selectedListID}`;
    const listItemsDB = ref(db, pathToSelectedList);

    const inputField = this.parentElement.querySelector('.input-field');

    if (inputField.value.length > 0) {
        push(listItemsDB, inputField.value);

        inputField.value = '';
    }

}

function removeItem() {
    const itemID = this.dataset.id;
    const listID = this.parentElement.parentElement.dataset.id;
    const pathToSelectedList = `${userID}/${listsContent}/${listID}`;
    const exactLocationOfItemInDB = ref(db, `${pathToSelectedList}/${itemID}`);
    const list = this.parentElement.querySelectorAll('li');

    remove(exactLocationOfItemInDB);

    //Create again empty list if remove the last item
    if (list.length === 1) {
        const listItemsRef = ref(db, `${userID}/${listsContent}`);
        update(listItemsRef, { [listID]: "" });
    }
}

// Open/Close currentElement
function toggleDomElement(currentElement, otherElementsForDisplayingNone, displayType) {
    if (currentElement.style.display === 'none') {

        if (otherElementsForDisplayingNone.length !== 0) {

            otherElementsForDisplayingNone.forEach(element => {
                if (element !== currentElement) {
                    element.style.display = 'none'
                    addRemoveEventsInShoppingList(element, 'none');
                };
            });

        }

        currentElement.style.display = displayType;
        addRemoveEventsInShoppingList(currentElement, displayType);
    } else {
        currentElement.style.display = 'none';
        addRemoveEventsInShoppingList(currentElement, 'none');
    }

    // Add or Remove EventListeners to elements in .shopping-list-div
    function addRemoveEventsInShoppingList(currentElement, toDisplay) {
        if (currentElement.classList.contains('shopping-list-div')) {
            const addButton = currentElement.querySelector('.add-button');
            const items = currentElement.querySelectorAll('.shopping-list-ul > li');

            if (toDisplay === 'flex') {
                addButton.addEventListener('click', addNewItem);
                items.forEach(item => {
                    item.addEventListener('dblclick', removeItem)
                });
            } else {
                addButton.removeEventListener('click', addNewItem);
                items.forEach(item => {
                    item.removeEventListener('dblclick', removeItem)
                });
            }
        }
    }
}

function displayErrorMessage(message) {
    // Display Error Container
    toggleDomElement(errorMessageContainer, [], 'flex');

    // Render text message
    document.querySelector('.error .message p').innerHTML = message;

    // Icon Close Button
    const iconClose = document.querySelector('.error .icon-close');

    function closeErrorMessage() {
        toggleDomElement(this.parentElement.parentElement, [], 'none');
        iconClose.removeEventListener('click', closeErrorMessage)
    }

    iconClose.addEventListener("click", closeErrorMessage);
}

function closeSettingsContainer() {
    toggleDomElement(this.parentElement.parentElement, [], 'none');

    // removeEventListeners from all buttons in Settings Container
    this.removeEventListener('click', closeSettingsContainer);
    themeSwitches.forEach(swith => swith.removeEventListener('click', switchThemeFromSettings));
}

function switchThemeFromSettings() {
    const lightThemeSwitch = document.querySelector('#light-theme-switch');
    const darkThemeSwitch = document.querySelector('#dark-theme-switch');

    if (this === lightThemeSwitch) {
        if (this.classList.contains('on')) {
            this.classList.replace('on', 'off');
            darkThemeSwitch.classList.replace('off', 'on');
            switchStylesheet('dark');
        } else {
            this.classList.replace('off', 'on');
            darkThemeSwitch.classList.replace('on', 'off');
            switchStylesheet('light');
        }
    } else if (this === darkThemeSwitch) {
        if (this.classList.contains('on')) {
            this.classList.replace('on', 'off');
            lightThemeSwitch.classList.replace('off', 'on');
            switchStylesheet('light');
        } else {
            this.classList.replace('off', 'on');
            lightThemeSwitch.classList.replace('on', 'off');
            switchStylesheet('dark');
        }
    }
}

function switchStylesheet(theme) {
    const lightTheme = document.getElementById('light');
    const darkTheme = document.getElementById('dark');

    const lightThemeSwitch = document.querySelector('#light-theme-switch');
    const darkThemeSwitch = document.querySelector('#dark-theme-switch');

    if (theme === 'light') {
        lightTheme.media = '';
        darkTheme.media = 'none';
        localStorage.shoppingListTheme = 'light';
        lightThemeSwitch.classList.replace('off', 'on');
        darkThemeSwitch.classList.replace('on', 'off');
    } else {
        lightTheme.media = 'none';
        darkTheme.media = '';
        localStorage.shoppingListTheme = 'dark';
        lightThemeSwitch.classList.replace('on', 'off');
        darkThemeSwitch.classList.replace('off', 'on');
    }
}

// Close Pop up Containers: .rename, .delete
function closeMessageContainers(button) {
    const messageContainer = button.parentElement.parentElement.parentElement;
    const inputElements = document.querySelectorAll('.message-container input') ? document.querySelectorAll('.message-container input') : false;
    if (inputElements) {
        inputElements.forEach(input => {
            input.value = '';
        });
    }
    toggleDomElement(messageContainer, [], 'none');
}

