function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
const EXAMPLES = {
    [generateUUID()]: {
        "title": "factorial",
        "language": "en",
        "version": "1.0",
        "code": `START
            num = (3 - 1) * 2
            LINE calculating factorial of num ...
            result = 1
            result *= num
            num --
            LINE calculating result * num
            IF num > 1 THEN GO 5
            IF result > 10 THEN size = very big ELSE size = small
            ECHO Result is result and its size
            ECHO !!!
            FINISH`
    },
    [generateUUID()]: {
        "title": "square",
        "language": "en",
        "version": "1.0",
        "code": `START
            Xres = 10
            Yres = 5
            x = 0
            y = 0
            // main loop
            ECHO |
            x ++
            IF x < Xres THEN GO 6
            x = 0
            LINE
            y ++
            IF y < Yres THEN GO 6
            FINISH`
    }
}
$(document).ready(function () {
    Object.keys(EXAMPLES).forEach(function (key) {
        let cleanedCode = EXAMPLES[key].code.replace(/^\s+|\s+$/gm, '');
        let html = `
            <button data-id="${key}" class="btn btn-outline-dark d-flex flex-column gap-1 border border-light p-2 rounded example">
                <div class="d-flex justify-content-between w-100">    
                    <span class="text-start">
                        ${EXAMPLES[key].title}
                    </span>
                    <div class="d-flex gap-1">
                        <span>${EXAMPLES[key].language}</span>
                        <span>${EXAMPLES[key].version}</span>
                    </div>
                </div>
                <div class="form-floating w-100" data-bs-theme="dark">
                    <textarea class="form-control text-bg-light p-1 px-2 w-100" readonly rows=5>${cleanedCode}</textarea>
                </div>
            </button>
        `;
        $("#examples").append(html);
    });
});
