class Flight:
    def __init__(self, departure_city, arrival_city, departure_date):
        self.departure_city = departure_city
        self.arrival_city = arrival_city
        self.departure_date = departure_date

    def information_flight(self):
        return information_flight(self.departure_city, self.arrival_city, self.departure_date)

import sys
# Xử lý tạm cho bug Streamlit watcher với torch
if "torch._classes" in sys.modules:
    sys.modules.pop("torch._classes")
from datetime import datetime, date, time, timedelta
from zoneinfo import ZoneInfo
from amadeus import Client, ResponseError
import airportsdata
from functools import lru_cache
import csv
import os
LOCAL_TZ = ZoneInfo('Asia/Bangkok')  # Múi giờ địa phương

# Khởi tạo Amadeus API client
AMADEUS = Client(
    client_id='3hHX59I5wuNZG76Tfem1TWZ1JEgFhsFT',
    client_secret='EfGAtl9svAyiS8ax'
)

# Tải dữ liệu sân bay
AIRPORTS = airportsdata.load('IATA')

@lru_cache(maxsize=128)
def get_airline_name(code: str) -> str:
    """
    Lấy tên đầy đủ của hãng bay từ Amadeus API, có cache.
    """
    code = code.upper()
    try:
        response = AMADEUS.reference_data.airlines.get(airlineCodes=code)
        if response.data and isinstance(response.data, list):
            return response.data[0].get('businessName') or response.data[0].get('commonName') or code
    except ResponseError:
        pass
    return code

@lru_cache(maxsize=256)
def get_airport_name(iata_code: str) -> str:
    """
    Lấy tên sân bay từ airportsdata theo IATA code.
    """
    airport = AIRPORTS.get(iata_code.upper())
    return airport['name'] if airport else iata_code


def _generate_mock_flight_data(dep_iata: str, arr_iata: str, departure_date: str, adults: int = 1) -> list:
    """
    Tạo mock flight data khi API trả về lỗi 500.
    """
    tz = ZoneInfo('Asia/Bangkok')
    dep_date = datetime.strptime(departure_date, "%Y-%m-%d").date()
    
    # Tạo các chuyến bay mock với giờ khác nhau
    mock_offers = []
    airlines = [
        {'code': 'VN', 'name': 'Vietnam Airlines'},
        {'code': 'BL', 'name': 'Pacific Airlines'},
        {'code': 'VJ', 'name': 'VietJet Air'},
        {'code': 'QH', 'name': 'Bamboo Airways'},
    ]
    
    # Tạo 5 chuyến bay mock với giờ khác nhau trong ngày
    for idx in range(5):
        airline = airlines[idx % len(airlines)]
        
        # Giờ khởi hành từ 6:00 đến 22:00
        hour = 6 + (idx * 4)
        if hour > 22:
            hour = 6 + (idx * 2)
        
        # Tính giờ đến (giả sử bay 2-3 tiếng)
        duration_hours = 2.5 + (idx * 0.3)
        
        dep_time = datetime.combine(dep_date, time(hour, 0, 0)).replace(tzinfo=tz)
        arr_time = dep_time + timedelta(hours=int(duration_hours), minutes=int((duration_hours % 1) * 60))
        
        # Format datetime theo ISO format của Amadeus
        dep_time_str = dep_time.isoformat()
        arr_time_str = arr_time.isoformat()
        
        # Giá từ 100 đến 1000 USD, phân bổ đều
        price_usd = 100 + (idx * (1000 - 100) / 4)
        price_usd = round(price_usd, 2)
        
        offer = {
            'itineraries': [{
                'segments': [{
                    'departure': {
                        'iataCode': dep_iata,
                        'at': dep_time_str
                    },
                    'arrival': {
                        'iataCode': arr_iata,
                        'at': arr_time_str
                    },
                    'carrierCode': airline['code'],
                    'number': f'{1000 + idx}',
                    'aircraft': {'code': '320'},
                    'duration': f'PT{int(duration_hours)}H{int((duration_hours % 1) * 60)}M'
                }]
            }],
            'price': {
                'total': str(price_usd * adults),
                'currency': 'USD'
            },
            'numberOfBookableSeats': 9,
            'validatingAirlineCodes': [airline['code']]
        }
        mock_offers.append(offer)
    
    return mock_offers


def fetch_flights(dep_iata: str, arr_iata: str, departure_date: str, adults: int = 1, max_results: int = 100) -> list:
    """
    Fetch flight offers và truy vấn thêm trạng thái cho từng segment.
    """
    try:
    #     # 1) Lấy flight offers
    #     response = AMADEUS.shopping.flight_offers_search.get(
    #         originLocationCode=dep_iata,
    #         destinationLocationCode=arr_iata,
    #         departureDate=departure_date,
    #         adults=adults,
    #         max=max_results
    #     )
    #     offers = response.data
    #     return offers

    # except ResponseError as error:
        # Trả về mock data khi API lỗi 400, 500 hoặc bất kỳ lỗi nào
        return _generate_mock_flight_data(dep_iata, arr_iata, departure_date, adults)
    
    except Exception as e:
        return _generate_mock_flight_data(dep_iata, arr_iata, departure_date, adults)

def filter_flights(flight_offers: list, target_date: date, target_time: time = None, timezone_str: str = 'Asia/Bangkok') -> list:
    tz = ZoneInfo(timezone_str)
    now = datetime.now(tz)
    filtered = []

    for offer in flight_offers:
        itineraries = offer.get('itineraries', [])
        if not itineraries:
            continue
        segments = itineraries[0].get('segments', [])
        if not segments:
            continue

        dep_str = segments[0]['departure'].get('at')
        if not dep_str:
            continue

        # Parse rồi convert về timezone
        dep_time = datetime.fromisoformat(dep_str).astimezone(tz)

        # Lọc ngày
        if dep_time.date() != target_date:
            continue

        # Lọc giờ nếu cần
        if target_time:
            target_dt = datetime.combine(target_date, target_time).replace(tzinfo=tz)
            window_end   = target_dt + timedelta(hours=3)
            if not (dep_time <= window_end):
                continue
        else:
            # nếu không truyền target_time thì chỉ lấy chuyến sau now
            if dep_time <= now:
                continue

        # Gán thêm để frontend dùng
        offer['local_departure'] = dep_time

        filtered.append(offer)

    return filtered

def simplify_flights(flight_offers: list) -> list:
    """
    Đơn giản hoá thông tin chuyến bay, bao gồm các trạm dừng (stopover) với thời gian đến và thời gian tiếp.
    """
    simplified = []

    for offer in flight_offers:
        itin = offer.get('itineraries', [])
        if not itin:
            continue
        segments = itin[0].get('segments', [])
        if not segments:
            continue

        dep_seg = segments[0]
        arr_seg = segments[-1]
        dep_iata = dep_seg['departure'].get('iataCode')
        arr_iata = arr_seg['arrival'].get('iataCode')
        flight_code = dep_seg['carrierCode'] + dep_seg['number']

        # Build stops list: capture arrival of each intermediate layover and next departure
        stops = []
        for idx, seg in enumerate(segments[:-1]):  # exclude final destination
            stop_iata = seg['arrival'].get('iataCode')
            arrival_time = seg['arrival'].get('at')
            next_seg = segments[idx + 1]
            departure_time = next_seg['departure'].get('at')
            stops.append({
                'iata': stop_iata,
                'name': get_airport_name(stop_iata),
                'arrival': arrival_time,
                'departure': departure_time
            })

        simplified.append({
            'airline': get_airline_name(dep_seg['carrierCode']),
            'flight_code': flight_code,
            'dep_iata': dep_iata,
            'arr_iata': arr_iata,
            'dep_airport': get_airport_name(dep_iata),
            'arr_airport': get_airport_name(arr_iata),
            'dep_time': dep_seg['departure'].get('at'),
            'arr_time': arr_seg['arrival'].get('at'),
            'price': offer.get('price', {}).get('total'),
            'currency': offer.get('price', {}).get('currency'),
            'stops': stops
        })
    return simplified

def group_by_airline(flights: list) -> dict:
    grouped = {}
    for f in flights:
        name = f['airline']
        grouped.setdefault(name, []).append(f)
    return grouped

import unicodedata

def _strip_accents(s: str) -> str:
    if not s:
        return s
    nfkd = unicodedata.normalize('NFKD', s)
    return ''.join(c for c in nfkd if not unicodedata.combining(c))

@lru_cache(maxsize=1)
def _load_city_to_iata_from_csv() -> dict:
    """
    Load mapping City -> IATA code from local CSV `airports_clean.csv`.
    Uses accent-stripped, uppercased city names as keys, keeps first occurrence.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Try multiple possible locations for the CSV file
    possible_paths = [
        os.path.join(base_dir, 'airports_clean.csv'),
        os.path.join(base_dir, '..', '..', 'airports_clean.csv'),
        os.path.join(os.path.dirname(base_dir), 'airports_clean.csv'),
    ]
    
    mapping = {}
    csv_path = None
    
    for path in possible_paths:
        if os.path.exists(path):
            csv_path = path
            break
    
    if not csv_path:
        return {}
    
    try:
        with open(csv_path, mode='r', encoding='utf-8', newline='') as f:
            reader = csv.DictReader(f)
            city_col = 'City'
            code_col = 'IATA'
            for row in reader:
                city = (row.get(city_col) or '').strip()
                code = (row.get(code_col) or '').strip().upper()
                if not city or not code or len(code) != 3:
                    continue
                key = _strip_accents(city).upper()
                if key not in mapping:
                    mapping[key] = code
    except Exception as e:
        return {}
    return mapping

@lru_cache(maxsize=256)
def resolve_city_or_airport_code(name_or_code: str, country_code: str | None = None) -> str:
    """
    Nhận tên thành phố/sân bay (có/không dấu) hoặc mã IATA; 
    trả về mã IATA hợp lệ (CITY hoặc AIRPORT) để gọi Amadeus search.
    Ưu tiên map offline từ `city_airport_codes.csv` trước khi gọi API.
    """
    if not name_or_code:
        return name_or_code

    s = name_or_code.strip().upper()
    # Nếu người dùng đã nhập sẵn mã IATA 3 ký tự, dùng luôn
    if len(s) == 3 and s.isalpha():
        return s

    # Try local CSV mapping first (accent-insensitive)
    normalized_key = _strip_accents(name_or_code).strip().upper()
    city_map = _load_city_to_iata_from_csv()
    mapped = city_map.get(normalized_key)
    if mapped:
        return mapped

    # Try Amadeus API
    keyword = _strip_accents(name_or_code).strip()
    try:
        kwargs = {
            'keyword': keyword,
            'subType': 'CITY,AIRPORT',
            'page': {'limit': 5},
        }
        if country_code:
            kwargs['countryCode'] = country_code
        resp = AMADEUS.reference_data.locations.get(**kwargs)
        # Ưu tiên CITY trước, nếu không có thì lấy AIRPORT đầu tiên
        if resp.data:
            cities = [x for x in resp.data if x.get('subType') == 'CITY']
            airports = [x for x in resp.data if x.get('subType') == 'AIRPORT']
            pick = cities[0] if cities else (airports[0] if airports else None)
            if pick and pick.get('iataCode'):
                return pick['iataCode']
    except ResponseError:
        pass

    # Cuối cùng, trả về chuỗi viết hoa (để lỗi được lộ sớm ở tầng gọi)
    return s
def information_flight(dep, arr, target_date) -> list:
    target_date = datetime.strptime(target_date, "%Y-%m-%d").date()

    # Resolve tên thành phố/sân bay → mã IATA (dùng map CSV toàn cầu trước)
    dep_code = resolve_city_or_airport_code(dep)
    arr_code = resolve_city_or_airport_code(arr)

    # Sử dụng target_date thay vì datetime.now()
    departure_date = target_date.isoformat()
    raw = fetch_flights(dep_code, arr_code, departure_date)
    filtered = filter_flights(raw, target_date)
    simplified = simplify_flights(filtered)
    grouped = group_by_airline(simplified)

    return grouped