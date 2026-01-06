import logging
import time
import base64
from typing import (
    Dict,
    Any,
    Optional,
    List,
)
import httpx

from .zoom_models import (
    ZoomConfig,
    CreateMeetingParams,
    UpdateMeetingParams,
    ZoomMeeting,
    MeetingListParams,
    MeetingListResponse,
    ZoomParticipant,
    ParticipantListResponse,
    ZoomRecording,
    RecordingListResponse,
)


_LOG = logging.getLogger("uvicorn.info")


class ZoomClientError(Exception):
    pass


class ZoomClient:
    """Клиент для работы с Zoom API (Server-to-Server OAuth)"""
    
    BASE_URL = "https://api.zoom.us/v2"
    OAUTH_URL = "https://zoom.us/oauth/token"
    
    def __init__(
        self,
        config: ZoomConfig,
    ):
        self.config = config
        # Очищаем данные от пробелов и лишних символов
        self.account_id = config.account_id.strip() if config.account_id else ""
        self.client_id = config.client_id.strip() if config.client_id else ""
        self.client_secret = config.client_secret.strip() if config.client_secret else ""
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0
        
        # Проверяем, что все данные заполнены
        if not self.account_id:
            raise ZoomClientError("Account ID cannot be empty")
        if not self.client_id:
            raise ZoomClientError("Client ID cannot be empty")
        if not self.client_secret:
            raise ZoomClientError("Client Secret cannot be empty")
    
    async def _get_access_token(
        self,
    ) -> str:
        """Получить или обновить access token"""
        # Если токен еще действителен, возвращаем его
        if self._access_token and time.time() < self._token_expires_at:
            return self._access_token
        
        # Получаем новый токен
        # Для Zoom Server-to-Server OAuth используется Basic Auth с Client ID:Client Secret
        # Данные уже очищены в __init__, но на всякий случай еще раз очищаем
        client_id_clean = self.client_id.strip()
        client_secret_clean = self.client_secret.strip()
        account_id_clean = self.account_id.strip()
        
        credentials = f"{client_id_clean}:{client_secret_clean}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        # Формируем данные для OAuth запроса
        # Для Server-to-Server OAuth нужен grant_type=account_credentials и account_id
        data = {
            "grant_type": "account_credentials",
            "account_id": account_id_clean,
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                _LOG.info(f"Requesting Zoom OAuth token from {self.OAUTH_URL}")
                _LOG.info(f"Account ID: {self.account_id}")
                _LOG.info(f"Client ID: {self.client_id}")
                _LOG.info(f"Client Secret length: {len(self.client_secret)}")
                _LOG.info(f"Grant type: {data['grant_type']}")
                
                # Логируем заголовки (без секрета)
                _LOG.info(f"Headers: Authorization=Basic ***, Content-Type={headers['Content-Type']}")
                
                response = await client.post(
                    self.OAUTH_URL,
                    headers=headers,
                    data=data,
                )
                
                _LOG.info(f"Zoom OAuth response status: {response.status_code}")
                _LOG.info(f"Zoom OAuth response headers: {dict(response.headers)}")
                
                # Логируем тело ответа для диагностики
                response_text = response.text
                _LOG.info(f"Zoom OAuth response body: {response_text[:500]}")  # Первые 500 символов
                
                response.raise_for_status()
                token_data = response.json()
                
                self._access_token = token_data.get("access_token")
                expires_in = token_data.get("expires_in", 3600)  # По умолчанию 1 час
                self._token_expires_at = time.time() + expires_in - 60  # Вычитаем 1 минуту для запаса
                
                # Логируем scopes из токена (если доступны)
                token_scopes = token_data.get("scope", "Not provided")
                _LOG.info(f"Zoom OAuth token obtained successfully. Scopes: {token_scopes}")
                
                if not self._access_token:
                    _LOG.error(f"No access_token in response: {token_data}")
                    raise ZoomClientError("Failed to get access token: no access_token in response")
                
                # Проверяем, что токен содержит нужные scopes (предупреждение, не ошибка)
                required_scopes = ["meeting:write:meeting", "meeting:write:meeting:admin"]
                if token_scopes and isinstance(token_scopes, str):
                    token_scopes_list = token_scopes.split()
                    missing_scopes = [scope for scope in required_scopes if scope not in token_scopes_list]
                    if missing_scopes:
                        _LOG.warning(f"Token is missing required scopes: {missing_scopes}. Please add these scopes in Zoom App Marketplace.")
                
                return self._access_token
        except httpx.HTTPStatusError as e:
            error_detail = "Unknown error"
            try:
                error_data = e.response.json()
                error_detail = error_data.get("error_description") or error_data.get("error") or str(e)
                _LOG.error(f"Zoom OAuth HTTP error {e.response.status_code}: {error_detail}")
                _LOG.error(f"Response body: {e.response.text}")
            except:
                _LOG.error(f"Zoom OAuth HTTP error {e.response.status_code}: {e.response.text}")
            raise ZoomClientError(f"Failed to get access token: {error_detail}") from e
        except httpx.HTTPError as e:
            _LOG.error(f"Zoom OAuth request error: {e}")
            raise ZoomClientError(f"Failed to get access token: {e}") from e
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Выполнить запрос к Zoom API"""
        url = f"{self.BASE_URL}/{endpoint.lstrip('/')}"
        
        access_token = await self._get_access_token()
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    headers=headers,
                )
                response.raise_for_status()
                
                # Zoom API может возвращать пустой ответ для некоторых операций
                if response.status_code == 204:
                    return {}
                
                return response.json()
        except httpx.HTTPStatusError as e:
            error_detail = "Unknown error"
            try:
                error_data = e.response.json()
                error_detail = error_data.get("message", str(e))
            except:
                error_detail = str(e)
            
            _LOG.error(f"Zoom API request error: {e.response.status_code} - {error_detail}")
            raise ZoomClientError(f"Zoom API error: {error_detail}") from e
        except httpx.HTTPError as e:
            _LOG.error(f"Zoom API request error: {e}")
            raise ZoomClientError(f"Failed to make request to Zoom: {e}") from e
    
    async def test_connection(self) -> bool:
        """Проверить соединение с Zoom API"""
        try:
            _LOG.info("Testing Zoom connection...")
            # Простой запрос для проверки соединения - получаем информацию о текущем пользователе
            result = await self._make_request(
                method="GET",
                endpoint="/users/me",
            )
            user_id = result.get("id")
            _LOG.info(f"Zoom connection test successful, user ID: {user_id}")
            return user_id is not None
        except ZoomClientError as e:
            _LOG.error(f"Zoom connection test failed: {e}")
            raise
        except Exception as e:
            _LOG.error(f"Connection test failed with unexpected error: {e}")
            return False
    
    async def create_meeting(
        self,
        params: CreateMeetingParams,
    ) -> ZoomMeeting:
        """Создать встречу"""
        try:
            user_id = params.user_id or "me"
            
            meeting_data: Dict[str, Any] = {
                "topic": params.topic,
                "type": params.type,
                "duration": params.duration or 30,
            }
            
            if params.start_time:
                # Zoom API требует формат ISO 8601
                meeting_data["start_time"] = params.start_time.strftime("%Y-%m-%dT%H:%M:%S")
            
            if params.timezone:
                meeting_data["timezone"] = params.timezone
            
            if params.password:
                meeting_data["password"] = params.password
            
            if params.agenda:
                meeting_data["agenda"] = params.agenda
            
            if params.settings:
                meeting_data["settings"] = params.settings.dict(exclude_none=True)
            
            result = await self._make_request(
                method="POST",
                endpoint=f"/users/{user_id}/meetings",
                data=meeting_data,
            )
            
            return ZoomMeeting(**result)
        except Exception as e:
            _LOG.error(f"Error creating meeting: {e}")
            raise ZoomClientError(f"Failed to create meeting: {e}") from e
    
    async def get_meeting(
        self,
        meeting_id: str,
    ) -> ZoomMeeting:
        """Получить информацию о встрече"""
        try:
            result = await self._make_request(
                method="GET",
                endpoint=f"/meetings/{meeting_id}",
            )
            return ZoomMeeting(**result)
        except Exception as e:
            _LOG.error(f"Error getting meeting: {e}")
            raise ZoomClientError(f"Failed to get meeting: {e}") from e
    
    async def update_meeting(
        self,
        meeting_id: str,
        params: UpdateMeetingParams,
    ) -> None:
        """Обновить встречу"""
        try:
            meeting_data: Dict[str, Any] = {}
            
            if params.topic is not None:
                meeting_data["topic"] = params.topic
            
            if params.type is not None:
                meeting_data["type"] = params.type
            
            if params.start_time:
                meeting_data["start_time"] = params.start_time.strftime("%Y-%m-%dT%H:%M:%S")
            
            if params.duration is not None:
                meeting_data["duration"] = params.duration
            
            if params.timezone is not None:
                meeting_data["timezone"] = params.timezone
            
            if params.password is not None:
                meeting_data["password"] = params.password
            
            if params.agenda is not None:
                meeting_data["agenda"] = params.agenda
            
            if params.settings:
                meeting_data["settings"] = params.settings.dict(exclude_none=True)
            
            await self._make_request(
                method="PATCH",
                endpoint=f"/meetings/{meeting_id}",
                data=meeting_data,
            )
        except Exception as e:
            _LOG.error(f"Error updating meeting: {e}")
            raise ZoomClientError(f"Failed to update meeting: {e}") from e
    
    async def delete_meeting(
        self,
        meeting_id: str,
    ) -> None:
        """Удалить встречу"""
        try:
            await self._make_request(
                method="DELETE",
                endpoint=f"/meetings/{meeting_id}",
            )
        except Exception as e:
            _LOG.error(f"Error deleting meeting: {e}")
            raise ZoomClientError(f"Failed to delete meeting: {e}") from e
    
    async def list_meetings(
        self,
        params: MeetingListParams,
    ) -> MeetingListResponse:
        """Получить список встреч"""
        try:
            user_id = params.user_id or "me"
            
            query_params: Dict[str, Any] = {
                "type": params.type or "live",
                "page_size": params.page_size or 30,
            }
            
            if params.next_page_token:
                query_params["next_page_token"] = params.next_page_token
            
            result = await self._make_request(
                method="GET",
                endpoint=f"/users/{user_id}/meetings",
                params=query_params,
            )
            
            meetings = [ZoomMeeting(**meeting) for meeting in result.get("meetings", [])]
            
            return MeetingListResponse(
                meetings=meetings,
                page_size=result.get("page_size", 30),
                next_page_token=result.get("next_page_token"),
                total_records=result.get("total_records"),
            )
        except Exception as e:
            _LOG.error(f"Error listing meetings: {e}")
            raise ZoomClientError(f"Failed to list meetings: {e}") from e
    
    async def get_meeting_participants(
        self,
        meeting_id: str,
        page_size: int = 30,
        next_page_token: Optional[str] = None,
    ) -> ParticipantListResponse:
        """Получить список участников встречи"""
        try:
            query_params: Dict[str, Any] = {
                "page_size": page_size,
            }
            
            if next_page_token:
                query_params["next_page_token"] = next_page_token
            
            result = await self._make_request(
                method="GET",
                endpoint=f"/report/meetings/{meeting_id}/participants",
                params=query_params,
            )
            
            participants = [ZoomParticipant(**p) for p in result.get("participants", [])]
            
            return ParticipantListResponse(
                participants=participants,
                page_count=result.get("page_count", 0),
                page_size=result.get("page_size", 30),
                total_records=result.get("total_records", 0),
                next_page_token=result.get("next_page_token"),
            )
        except Exception as e:
            _LOG.error(f"Error getting meeting participants: {e}")
            raise ZoomClientError(f"Failed to get meeting participants: {e}") from e
    
    async def get_meeting_recordings(
        self,
        meeting_id: str,
        page_size: int = 30,
        next_page_token: Optional[str] = None,
    ) -> RecordingListResponse:
        """Получить список записей встречи"""
        try:
            query_params: Dict[str, Any] = {
                "page_size": page_size,
            }
            
            if next_page_token:
                query_params["next_page_token"] = next_page_token
            
            result = await self._make_request(
                method="GET",
                endpoint=f"/meetings/{meeting_id}/recordings",
                params=query_params,
            )
            
            recordings = []
            for recording in result.get("recording_files", []):
                recordings.append(ZoomRecording(
                    id=recording.get("id", ""),
                    meeting_id=meeting_id,
                    recording_start=recording.get("recording_start"),
                    recording_end=recording.get("recording_end"),
                    file_type=recording.get("file_type", ""),
                    file_size=recording.get("file_size"),
                    play_url=recording.get("play_url"),
                    download_url=recording.get("download_url"),
                    status=recording.get("status"),
                ))
            
            return RecordingListResponse(
                recordings=recordings,
                page_size=result.get("page_size", 30),
                next_page_token=result.get("next_page_token"),
                total_records=result.get("total_records"),
            )
        except Exception as e:
            _LOG.error(f"Error getting meeting recordings: {e}")
            raise ZoomClientError(f"Failed to get meeting recordings: {e}") from e

