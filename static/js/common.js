var goBackButtons = document.querySelectorAll('.goBack');

for(var i = 0; i < goBackButtons.length; i++)
    goBackButtons[i].addEventListener('click', function (evt) {
        evt.preventDefault();
        history.back();
    });