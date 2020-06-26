(function(){
    var formatPhoneNumber = function (str) {
        str = str.replace(/-/g, '');
        str = str.replace(/^(02|[0-9]{3})([0-9]*?)([0-9]{1,4})$/, "$1-$2-$3").replace('--', '-');
        return str;
    }
    var unhyphenPos = function (str, pos) {
        var newPos = pos;
        for (var i = 0; i < pos; i++) {
            if (str[i] == '-') {
                newPos--;
            }
        }
        return newPos;
    }
    var hyphenPos = function (str, pos) {
        for (var i = 0; i < pos; i++) {
            if (str[i] == '-') {
                pos++;
            }
        }
        return pos;
    }
    var telInputs = document.querySelectorAll('input[type="tel"]');
    var keyFilter = [8, 9, 46, 37, 39];
    for (var i = 0; i < 10; i++) {
        keyFilter.push(48 + i);
        keyFilter.push(96 + i);
    }
    for (var i = 0; i < telInputs.length; i++) {
        var telInput = telInputs[i];
        telInput.addEventListener('keydown', function (evt) {
            if(!keyFilter.includes(evt.keyCode)) {
                evt.preventDefault();
                return false;
            }
        })
        telInput.addEventListener('input', function (evt) {
            var input = evt.target, value = input.value;
            var selStart = input.selectionStart, selEnd = input.selectionEnd;
            selStart = unhyphenPos(value, selStart), selEnd = unhyphenPos(value, selEnd);
            value = formatPhoneNumber(value);
            selStart = hyphenPos(value, selStart), selEnd = hyphenPos(value, selEnd);
            input.value = value;
            input.selectionStart = selStart;
            input.selectionEnd = selEnd;
        });
    }
})();