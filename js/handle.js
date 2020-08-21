// 判断是否已经登录
if(mainPageData.id == undefined) {
    promptMessage('还未登录, 请先进行登录!', 'warning', 3000, 'inco-sign', '', [{
        text: '立即返回登录',
        action: function(){
            location.href = '../index.html';
        }
    }]).show();
    var timer = setTimeout(() => {
        location.href = '../index.html';
        clearTimeout(timer);
    }, 3000);
}

// 点击菜单栏切换菜单
$('.menu').on('click', function (e) {
    if (e.target.classList.contains('sub-menu')) {
        if (e.target.classList.contains('sub-current')) {
            return;
        }
        getFriendList(e.target.classList.contains('message-menu'));
        $(e.target).addClass('sub-current').siblings().removeClass('sub-current');
        $('.main').children().eq($(e.target).index()).addClass('main-current').siblings().removeClass('main-current');

        $(".main-wrap .session-friend")
            .eq(1).removeClass('session-display-default').end()
            .eq(0).addClass('session-display-default');
        $(".main-content .friend-info").html('<div class="default">点击左侧用户展开信息</div>')
    }
})

// 退出登录
$(".exit-login").on('click', function() {
    promptMessage('确定退出登录？', 'warning', 0, 'info-sign', false,
        [{
            text: '确定',
            action: function () {exitLogin();}
        },{
            text: '取消',
            close: true
        }]
    ).show()
})

// 初始化主页面用户信息
$('.avatar img').attr('src', `${APIPATH}${mainPageData.headLogo.replace('/chat_api', '')}`);
$(".username").html(`${mainPageData.nickname}&ensp;&ensp;(用户名:&ensp;${mainPageData.username})`);

// 渲染好友列表
getFriendList(true);

// 点击好友列表中的好友进行聊天
$('.message-friend-list ul').on('click', 'li' ,function(e) {
    $(e.currentTarget).addClass('current-friend')
        .find('.new-message').html(0).css('display', 'none').end()
        .siblings().removeClass('current-friend');
    $(".main-wrap .session-friend")
        .eq(0).removeClass('session-display-default').end()
        .eq(1).addClass('session-display-default');

    if(e.currentTarget.dataset.user_id == sessionFriendId) {return ;}
    sessionFriendId = e.currentTarget.dataset.user_id;
    mainPageData.operationFriendId = e.currentTarget.dataset.user_id;
    // 获取当前聊天用户信息
    $.ajax({
        url: `${APIPATH}interface/getUserInfo.php`,
        type: 'get',
        data: {
            sign_str: mainPageData.sign_str,
            user_id: mainPageData.id,
            friend_id: sessionFriendId
        },
        success: function (res) {
            if (res.code == 3) {
                var errorMessage = new $.zui.Messager('提示消息：本次登录已经过期, 请重新登录', {
                    type: 'warning',
                    time: 3000,
                    icon: 'info-sign',
                    actions: [{
                        text: '返回登录页面',
                        action: function () {
                            location.href = '../index.html';
                        }
                    }]
                }).show();
                return;
            }
            renderMessageFriendInfo(res.data[0], false);
        },
        error: function (err) {
            console.log(err)
        }
    })
    getHistoryMessage();
})

// 点击发送消息
$("#send-message").click(function(){
    var message = $("#input-message").val();
    $("#input-message").val('');
    sendMessage(message, sessionFriendId, 'send', new Date().toTimeString().split(' ')[0]);
})

$(".input-message").on('keydown', function(e) {
    if(e.keyCode == 13) {
        $("#send-message").click();
    }
})

// 长轮询全局获取接收的消息
receiveMessage();

// 点击搜索用户并渲染用户列表
$('#find-friend').on('click', function () {
    var val = $("#inputSearch").val();
    if ($("#inputSearch").val() == '') { return; }
    $(".friend-list-wrap .main-content .friend-list")
        .eq(0).removeClass('list-current').end()
        .eq(1).addClass('list-current');
    $(".return-friend-list").on('click', function() {
        $(".main-content .friend-info").html('<div class="default">点击左侧用户展开信息</div>')
        $(".friend-list-wrap .main-content .friend-list")
            .eq(1).removeClass('list-current').end()
            .eq(0).addClass('list-current');
        $("#inputSearch").val('')
    })
    getSearchUsers(val);
})

// 点击用户列表展示对应的用户信息
$('.main-content ul').on('click', 'li',function (e) {
    var friendId = e.currentTarget.dataset.user_id;
    var isFriend = e.currentTarget.dataset.is_friend;
    getUserInfo(friendId, isFriend);
})

// 对展示的用户进行操作
$(".friend-info").on('click', function (e) {
    if (e.target.classList.contains('btn-send-message')) {
        /* 发消息 */
        sendFriendMessage();
    } else if (e.target.classList.contains('btn-delete-friend')) {
        /* 删除好友 */
        deleteFriend();
    } else if (e.target.classList.contains('btn-add-friend')) {
        /* 添加好友 */
        addFriend();
    }
})

// 长轮询全局获取好友申请信息
getFriendRequests();

// 点击新朋友展示申请信息
$(".handle-apply").on('click', '.click-handle-apply' ,function () {
    var requestFriend = Object.keys(mainPageData.friendRequests);
    var len = requestFriend.length;
    var str = '';
    for(var i = len - 1; i >= 0; i --) {
        var data = mainPageData.friendRequests[requestFriend[i]];
        str += `
            <li>
                <div class="new-friend-avatar">
                    <img src="${IMGPATH}${data.head_logo.replace('/chat_api', '')}" alt="">
                </div>
                <div class="new-friend-info">
                    <div class="new-friend-username">用户ID: ${data.user_id}</div>
                    <div class="new-friend-nickname">昵称: ${data.nickname}</div>
                </div>
                <div class="request-time">${data.time}</div>
                <div class="handle-apply-request">
                <div class="btn-group" data-request_id="${data.request_id}" style="width: 190px;">
                    <button type="button" class="btn" onclick="processFriendRequest(${data.user_id}, ${data.request_id}, 1);">同意</button>
                    <button type="button" class="btn" onclick="processFriendRequest(${data.user_id}, ${data.request_id}, 2);">拒绝</button>
                    <button type="button" class="btn" onclick="processFriendRequest(${data.user_id}, ${data.request_id}, 3);">不再接收</button>
                </div>
                </div>
            </li>
        `;
    }
    $(".modal-body ul").html(str)
})

