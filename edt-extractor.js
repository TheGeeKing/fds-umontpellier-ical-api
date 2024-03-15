/**
 * The isItOpen function checks to see if the iron-icon element has an icon
 * attribute with a value of &quot;vaadin:chevron-circle-down&quot;. If it does, then
 * the function returns true. Otherwise, it returns false. This is used to
 * determine whether or not a given accordion item is open or closed.

 *
 * @param element Get the element that was clicked on
 *
 * @return True if the element is open, false otherwise
 *
 * @docauthor Trelent
 */
function isItOpen(element) {

    return (
        element.querySelector("iron-icon").icon === "vaadin:chevron-circle-down"
    );
}

/**
 * The getBranches function returns an array of all the branches on the page.
 *
 *
 *
 * @return An array of dom elements
 *
 * @docauthor Trelent
 */
function getBranches() {
    let branches = Array.from(
        document.querySelectorAll(".branch-layout .tree-buttons")
    );
    branches.shift();
    return branches;
}

/**
 * The getOpenBranches function returns an array of all the open branches.
 *
 *
 *
 * @return An array of buttons
 *
 * @docauthor Trelent
 */
function getOpenBranches() {
    return Array.from(getBranches()).filter((button) => isItOpen(button));
}

/**
 * The getClosedBranches function returns an array of all the closed branches.
 *
 *
 *
 * @return An array of all the closed branches
 *
 * @docauthor Trelent
 */
function getClosedBranches() {
    return Array.from(getBranches()).filter((button) => !isItOpen(button));
}

/**
 * The openBranches function opens all the closed branches in a tree.
 *
 *
 *
 * @return Undefined
 *
 * @docauthor Trelent
 */
function openBranches() {
    getClosedBranches().forEach((button) => button.click());
}

/**
 * The isThereAnyClosedBranch function returns true if there is at least one closed branch in the document.
 *
 *
 *
 * @return A boolean value
 *
 * @docauthor Trelent
 */
function isThereAnyClosedBranch() {
    return getClosedBranches().length > 0;
}

/**
 * The countCheckboxes function returns the number of checkboxes in the document.
 *
 *
 *
 * @return The number of checkboxes
 *
 * @docauthor Trelent
 */
function countCheckboxes() {
    return document.querySelectorAll("vaadin-checkbox").length;
}

/**
 * The countCheckedCheckboxes function returns the number of checked checkboxes.
 *
 *
 *
 * @return The number of checked checkboxes
 *
 * @docauthor Trelent
 */
function countCheckedCheckboxes() {
    return document.querySelectorAll("vaadin-checkbox[checked]").length;
}

/**
 * The getFromNCheckBoxes function returns an array of checkboxes from the nth index to the n + 35th index.
 *
 *
 * @param n Get the checkboxes from a specific index
const checkboxes = getfromncheckboxes(0);
console
 * @param y Get a specific number of checkboxes from the n parameter
 *
 * @return An array of 50 checkboxes
 *
 * @docauthor Trelent
 */
function getFromNCheckBoxes(n, y = 50) {
    // we get 50 checkboxes from n
    return Array.from(document.querySelectorAll("vaadin-checkbox")).slice(
        n,
        n + y
    );
}

/**
 * The isCheckboxChecked function returns true if the checkbox is checked, and false otherwise.
 *
 *
 * @param checkbox Determine if the checkbox is checked or not
 *
 * @return A boolean value
 *
 * @docauthor Trelent
 */
function isCheckboxChecked(checkbox) {
    return checkbox.ariaChecked === "true";
}

/**
 * The checkCheckboxes function checks all checkboxes on the page.
 *
 *
 * @param checkboxes Pass in the array of checkboxes to be checked
 *
 * @return Undefined
 *
 * @docauthor Trelent
 */
function checkCheckboxes(checkboxes) {
    checkboxes.forEach((checkbox) => {
        if (!isCheckboxChecked(checkbox)) {
            checkbox.click();
        }
    });
}

/**
 * The openEverything function opens all the branches of a tree.
 *
 *
 *
 * @return A promise
 *
 * @docauthor Trelent
 */
function openEverything() {
    while (isThereAnyClosedBranch()) {
        let closed = getClosedBranches();
        openBranches();
        while (!isItOpen(closed[-1])) {
            // timeout(2500);
            setTimeout(() => {
                console.log("Waiting for 2.5 seconds");
            }, 2500);
        }
        console.log("Ouvert");
    }
}

/**
 * The uncheckEverything function unchecks all checkboxes on the page.

 *
 *
 * @return Undefined, because it doesn't return anything
 *
 * @docauthor Trelent
 */
function uncheckEverything() {
    document
        .querySelectorAll("vaadin-checkbox[checked]")
        .forEach((checkbox) => {
            checkbox.click();
        });
}
