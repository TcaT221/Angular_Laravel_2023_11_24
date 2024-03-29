import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Howl } from 'howler';

import { AppComponent } from '../app.component';
declare var Plyr;

interface PlayListItem {
    id: number;
    key: string;
    playing: boolean;
    sound: Howl;
}

interface PlayerEvents {
    onEnd$: EventEmitter<any>;
    onStop$: EventEmitter<any>;
    onPlay$: EventEmitter<any>;
    onPause$: EventEmitter<any>;
    playing$: EventEmitter<any>;
    onSeek$: EventEmitter<any>;
}

var han = new EventEmitter();

@Injectable()
export class PlayerService {
    
    audioplayer;
    private playList: PlayListItem[];
    private index: number; // keep track of current playing index
    public playerEvents: PlayerEvents;

    constructor() {
        this.index = 0; // set initial index
        this.playerEvents = {
            onEnd$: new EventEmitter(),
            onStop$: new EventEmitter(),
            onPlay$: new EventEmitter(),
            onPause$: new EventEmitter(),
            playing$: new EventEmitter(),
            onSeek$: new EventEmitter()
        }
        this.audioplayer = new Plyr('#audioPlayerNew',{
            /*autoplay:true,
            youtube:{autoplay:true}*/
            });
    }

    init(tracks) {
        this.playList = initPlaylist(tracks,this.playerEvents,this.playNext);
    }

    playNew(i) {
        newSong(this.playList,i,this.index);
        this.index = i;
    }

    playSelectedTrack(track) {
        let selectedTrackIndex = this.findIndexOfTrackFromPlaylist(track);

        if (selectedTrackIndex == this.index) {
            let currentlyPlayed = this.playList[this.index];
            if (currentlyPlayed['playing']) {
                this.pause();
            } else {
                this.play();
            }
        } else {
            newSong(this.playList,selectedTrackIndex,this.index);
            this.index = selectedTrackIndex;
        }
    }

    playNext() {
        let index = this.index + 1;
        if(index < this.playList.length) {
            this.playNew(index);
            this.index = index;
        } else {
            this.playList[index-1].playing = false;
        }
    }

    playPrevious() {
        let index = this.index - 1;
        if(index >= 0) {
            this.playNew(index);
            this.index = index;
        }
    }

    stop() {
        stop(this.playList[this.index]);
    }

    play() {
        play(this.playList[this.index]);
    }

    pause() {
        pause(this.playList[this.index]);
    }

    fastForward(frwdTime=5) {
        let songObj = this.playList[this.index];

        let currentSeekPosision = songObj.sound.seek();
        songObj.sound.seek(currentSeekPosision + frwdTime);
    }

    fastBackword(bckwrdTime=5) {
        let songObj = this.playList[this.index];

        let currentSeekPosision = this.getSeekTime();
        songObj.sound.seek(currentSeekPosision - bckwrdTime);
    }

    moveOnSelectedSeek(time) {
        let songObj = this.playList[this.index];
        songObj.sound.seek(time);
    }

    findIndexOfTrackFromPlaylist(track) {
        return this.playList.findIndex(l => l.key==track.audioUrl);
    }

    getSeekTime() {
        let songObj = this.playList[this.index];
        return songObj.sound.seek();
    }

    getDuration() {
        let songObj = this.playList[this.index];
        return songObj.sound.duration();
    }

    repeat(isRepeat) {
        let songObj = this.playList[this.index];
        songObj.sound.loop(isRepeat);
    }

}

var playing = false;

function initPlaylist(tracks, playerEvents, playNext):PlayListItem[] {
    return setEvents(toPlaylist(tracks), playerEvents, playNext);
}

function toPlaylist(tracks):PlayListItem[] {
    return tracks.map(toPlaylistItem);
}

function toPlaylistItem(r:any): PlayListItem {
    let PlayListItem = <PlayListItem>({
        id: r.id,
        key: r.audioUrl,
        playing: false,
        sound: new Howl({src:[r.audioUrl]})
    })

    return PlayListItem;
}

function setEvents(playList:PlayListItem[],playerEvents:PlayerEvents, playNext): PlayListItem[] {
    playList.forEach((item) => {
        item.sound.on('end', () => {
            togglePlaying();
            playerEvents.onEnd$.emit(null);
            playerEvents.playing$.emit(playing);
        });
        item.sound.on('stop', () => {
            togglePlaying();
            playerEvents.onStop$.emit(null);
            playerEvents.playing$.emit(playing);
        });
        item.sound.on('play', () => {
            togglePlaying();
            playerEvents.onPlay$.emit(item);
            playerEvents.playing$.emit(playing);
        });
        item.sound.on('pause', () => {
            togglePlaying();
            playerEvents.onPause$.emit(null);
            playerEvents.playing$.emit(playing);
        });
        item.sound.on('seek', () => {
            playerEvents.onSeek$.emit(null);
        });
    });
    return playList;
}

function togglePlaying() {
    return playing = !playing;
}

function newSong(playlist:PlayListItem[],i:number,index:number):PlayListItem[] {
    let currentSong = playlist[index];
    let newSong = playlist[i];
    if(playing) {
        stop(currentSong)
    }
    play(newSong);
    return playlist;
}

function stop(song:PlayListItem):PlayListItem {
    song.sound.stop();
    song.playing = false;
    return song;
}

function play(song:PlayListItem):PlayListItem {
    song.sound.play();
    song.playing = true;
    return song;
}

function pause(song:PlayListItem):PlayListItem {
    song.sound.pause();
    song.playing = false;
    return song;
}
