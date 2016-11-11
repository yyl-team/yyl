'use strict';
var 
    color = require('../lib/colors');

var 
    wVersion = function(){
        var iVer = require('../package.json').version;
        console.log([
            '',
            '',
            '                                  X                         ',
            '                               .7@@                         ',
            '      .:i:i::..          ,0B@B@B@BP.EB         .::iii:.     ',
            '     vLi:i:iir7v7i.   .:Z@B@B@MM8MM@BO    .i7L77ii:i:iLv    ',
            '    .U. . ......:iLv77ri:.,7G@@B@B@BS.i777Li:...... . .U.   ',
            '    i7 .,,.  ..,...,......   .iLjU7,  ..,,...,.,.  .,, ri   ',
            '    7: vP2u7:...,.,.,.,.,.,..       ....,.,.,.,.,iYUS5.:v   ',
            '    7i uUuuXN:.,,,.,.,.,.,.,...,...,.,.,.,.,.,..uE1uJS,:v   ',
            '    7i vUY5u:.,.,.,.,.,.,.,.,.,.,.,,,.,.,.,.,.,..7SJj2,:7   ',
            '    :7 71FL. ..,.........,,,,,.,.,,,.........,.,. iSU2 r:   ',
            '    .J :E7  ...          ...,,,.,.,..         .... :Pu Y.   ',
            '     u..7.....  i5ZBMOS7.  ..,.,..   r1ZOB8S;   ... :i.U    ',
            '     ,L ....  vB@B@B@B@B@u  .....  7@B@BBM@B@BU  .... L:    ',
            '      1..,. :M@@88GGZGZOM@M:     .Z@MOZ8ZGZ88M@@i  ...1     ',
            '     ,L... 7@BM8OZ8G8ZGEG8@Bk:.:U@@88ZGZ8ZOG8GOB@U  ..L,    ',
            '     L:.. r@MMB@B@B@B@MMG8GMB@B@@MG88MB@@@B@B@BMO@1  .:J    ',
            '     u.. ,@MMZJi:..:72M@@BOZ8GOZ8ZMB@BMur,..:;jOMO@r ..u    ',
            '     U.. G@OBr          :EBOEGEGEOBX.          uB8B@ ..u    ',
            '    .Y. .BBGOOOB@B@@@Ou.  :B8GO8OB   ,1O@B@B@BMO8ZMB: .Y.   ',
            '    .u...@BOEOMMOMOMM@@@BUE@@@MMB@qFB@B@MM8MOMO8ZOM@:  u.   ',
            '     U.. Y@BOGOG8ZO8OM@@@BOr:.:::iGB@B@BM8OZ8ZO8OB@X  .2    ',
            '     v;.. ;MB@B@@@B@B@qL:  i8iN@Mv  ,7kMB@B@B@B@B@v  .rv    ',
            '      F,..  :v5kq5u;:      7@B@B@j      ,iL1PXSL:   .,5     ',
            '       2i...          ...7   ,:,   r:...            :U      ',
            '        7Li.. . .........2ukOE00OXjS,.,......     .uu       ',
            '          :vvr:.   . . .   L0:,:0r   . . .     ,:L0@        ',
            '               ijiii::,...  ivrLi ....::::iivYuZNEu         ',
            '              :@BFY15kSS5F1u.....u151S5S55JFB@MFLujkM,      ',
            '            ,B@B@BPv7LJuUuuu5YvL5U2U1ujL77PBBM@B@SB8:       ',
            '           1MMB@BMBM27rLjUU1UF1F25UuLLrv2MBMB@B1Nu          ',
            '           @@..BBGMM@O57r7YJuJuJjLL777kM@B@O@B .@B          ',
            '          ,Lr@Z@GOGOOBBMFLr7LJYJv7rLk@@@B@uMO@Z@iY.         ',
            '          O   MBO88GOOOM@MEuvrrrvuZM@0 ,@  MMBZ  .Z         ',
            '         rU   @B8OGO8O8OOMB@MZ1EM@BMM@u   M@8@B   Si        ',
            '         :8:iu@OOGO8OGO8O8OOMMBMM8OGOM@5 :@OOM@Yii8.        ',
            '           ,  BMGGZOG8Z8G8G8G8GOZ8ZGZOB@iN@OGMB  ,          ',
            '                   ----------------------',
            '                   + ' + color.yellow('yyl version: ' + iVer),
            '                   ----------------------',
        ].join("\n"));
    };

module.exports = wVersion;
