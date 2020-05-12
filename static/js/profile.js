/* eslint-disable */
var avatarImg = document.querySelector('img.avatarImg');
var avatarMode = document.querySelector('input.avatarMode');
var avatarFileInput = document.querySelector('input.avatarFile');
var avatarCropModal = document.querySelector('.modal.avatarCropModal');
var avatarData = document.querySelector('.avatarData');
var avatarHelp = document.querySelector('.avatar-help')
var cropper;

// Finish Crop Function
function finishCrop() {
    var canvas = cropper.getCroppedCanvas();
    canvas.toBlob(function (blob) {
        var fileReader = new FileReader(blob);
        fileReader.addEventListener('load', function(evt) {
            avatarData.value = evt.target.result;
            avatarMode.value = 'upload';
            avatarImg.src = evt.target.result;
            cropper.destroy();
            cropper = null;
            avatarCropModal.classList.remove('is-active');
            changeAvatarButton.style.display = '';
            removeAvatarButton.style.display = '';
            uploadAvatarButton.style.display = 'none';
            avatarHelp.style.display = '';
        });

        fileReader.readAsDataURL(blob);
    });
}

// Prepare crop modal
[...avatarCropModal.querySelectorAll('.modal-background, button.delete, button.close-modal')].forEach(function(i) { i.addEventListener('click', function (evt) {
    evt.preventDefault();
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    avatarCropModal.classList.remove('is-active');
})});
avatarCropModal.querySelector('.finish-crop').addEventListener('click', finishCrop);

// Crop modal
function showCropModal() {
    var avatarCropImg = document.querySelector('img.avatarCropImg');
    var fileReader = new FileReader();
    fileReader.addEventListener('load', function (evt) {
        avatarCropImg.src = evt.target.result;
        cropper = new Cropper(avatarCropImg, {initialAspectRatio: 1, aspectRatio: 1, viewMode: 2});
        avatarCropModal.classList.add('is-active');
    });

    if (avatarFileInput.files[0])
        fileReader.readAsDataURL(avatarFileInput.files[0]);
}

// File change event
avatarFileInput.addEventListener('change', function () {
    if (avatarFileInput.files[0]) {
        showCropModal();
    }
})

// Buttons
var changeAvatarButton = document.querySelector('#change-avatar');
var removeAvatarButton = document.querySelector('#remove-avatar');
var uploadAvatarButton = document.querySelector('#upload-avatar');

changeAvatarButton.addEventListener('click', function(evt) {
    evt.preventDefault();
    avatarFileInput.click();
});
removeAvatarButton.addEventListener('click', function(evt) {
    evt.preventDefault();
    avatarMode.value = 'remove';
    avatarImg.src = avatarImg.dataset.fallbackUrl;
    avatarData.value = '';
    avatarFileInput.value = '';
    changeAvatarButton.style.display = 'none';
    removeAvatarButton.style.display = 'none';
    uploadAvatarButton.style.display = '';
    avatarHelp.style.display = '';
});
uploadAvatarButton.addEventListener('click', function(evt) {
    evt.preventDefault();
    avatarFileInput.click();
});
