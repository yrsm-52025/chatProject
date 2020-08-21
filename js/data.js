/**
 * 获取localStorage数据
 * @param {*} key localStorage中的key string
 * @returns localStorage数据 arr
 */
function getData(key) {
    var str = localStorage.getItem(key) || "[]"
    var arr = JSON.parse(str)
    return arr
}

// 主要页面数据
var mainPageData = {};

// 登录用户信息
var loginUserInfo = getData('login_info');
// 存放登录用户默认信息
mainPageData.nickname = loginUserInfo.nickname;
mainPageData.username = loginUserInfo.username;
mainPageData.sign_str = loginUserInfo.sign_str;
mainPageData.headLogo = loginUserInfo.head_logo;
mainPageData.id = loginUserInfo.id;

// 初始化聊天列表项1 (key: 为聊天好友的ID, value 为聊天消息组成的对象)
mainPageData.sessionList = {};

// 初始化图片路径
var IMGPATH = 'http://118.24.25.7/chat_api/';
var APIPATH = 'http://118.24.25.7/chat_api/'
// 初始化聊天列表项2
mainPageData.messageList = {};

// 初始化新消息列表项
mainPageData.newMessageList = {};

// 初始化申请好友列表
mainPageData.friendRequests = {};

// 初始化聊天好友的信息
var sessionFriendId = null;
var sessionFriendHeadLogo = null;
var sessionFriendUsername = null;
var sessionFriendNickname = null;

// 定义提示信息
function promptMessage(text, type, time, icon, close = true, actions, placement) {
    return new $.zui.Messager('提示信息:' + text, {
        type: type,
        time: time,
        icon: icon,
        close: close,
        placement: placement,
        actions: actions
    })
}

// 声明字符串过期时的提示消息
var signatureExpired = promptMessage('本次登录已经过期, 请重新登录', 'warning', 0, 'info-sign', false, [{
    text: '返回登录页面',
    close: false,
    action: function () { location.href = '../index.html'; }
    }]
);
